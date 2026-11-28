import { domToBlob } from 'modern-screenshot'
import { zipSync } from 'fflate'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { PROMO_SLIDES, type PromoData } from './promo-slides'

/** Dibuja cada imagen fuera de la pantalla y la convierte en PNG del ancho de su red (1080 o 1920 px). */
export async function renderPromoPngs(data: PromoData, ids?: string[]) {
  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  Object.assign(host.style, { position: 'fixed', left: '-20000px', top: '0', pointerEvents: 'none' })
  document.body.appendChild(host)
  const root = createRoot(host)
  const out: { id: string; blob: Blob }[] = []
  try {
    for (const slide of PROMO_SLIDES.filter(item => !ids || ids.includes(item.id))) {
      flushSync(() => root.render(slide.render(data)))
      const node = host.firstElementChild as HTMLElement
      await Promise.all([...node.querySelectorAll('img')].map(img => img.decode().catch(() => undefined)))
      await document.fonts.ready
      const blob = await domToBlob(node, { scale: slide.exportWidth / slide.width, type: 'image/png' })
      out.push({ id: slide.id, blob })
    }
  } finally {
    root.unmount()
    host.remove()
  }
  return out
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

const fileName = (name: string, id: string) => `HaNet ${name} ${id}.png`

/** Una sola imagen. */
export async function downloadPromoSlide(data: PromoData, id: string) {
  const [first] = await renderPromoPngs(data, [id])
  if (first) save(first.blob, fileName(data.name, first.id))
}

/** Todas, en un .zip. */
export async function downloadPromoZip(data: PromoData) {
  const pngs = await renderPromoPngs(data)
  const files: Record<string, Uint8Array> = {}
  for (const { id, blob } of pngs) files[fileName(data.name, id)] = new Uint8Array(await blob.arrayBuffer())
  save(new Blob([zipSync(files, { level: 0 })], { type: 'application/zip' }), `HaNet ${data.name} · imágenes para redes.zip`)
}
