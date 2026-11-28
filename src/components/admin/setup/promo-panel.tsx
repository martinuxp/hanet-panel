import { Download, FileArchive } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Button } from '@/components/arc/button/button'
import { urlToDataUrl } from '@/lib/data-url'
import { describeError } from '@/lib/errors'
import type { AdminInstitution } from '@/lib/hnt-admin'
import { PROMO_SLIDES, type PromoData } from './promo/promo-slides'

/** Alto de las miniaturas: así las tres proporciones se ven en una sola fila. */
const THUMB_HEIGHT = 210

/** Imágenes para redes: el carrusel "Bienvenidos a HaNet" con el nombre y el escudo del liceo. */
export function PromoPanel({ institution }: { institution: AdminInstitution }) {
  const [shield, setShield] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void urlToDataUrl(institution.logoUrl).then(value => { if (alive) setShield(value) })
    return () => { alive = false }
  }, [institution.logoUrl])

  const data: PromoData = { name: institution.name, shield }

  async function run(key: string, task: (exporter: typeof import('./promo/promo-export')) => Promise<void>) {
    setBusy(key)
    setError(null)
    try {
      await task(await import('./promo/promo-export'))
    } catch (failure) {
      console.error('Imágenes para redes', failure)
      setError(describeError(failure, 'No pudimos armar las imágenes. Inténtalo nuevamente.'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-medium">Imágenes para redes</h3>
        <p className="max-w-prose text-(length:--text-sm) text-(--text-secondary)">
          Un carrusel de 5 imágenes (1080 × 1350, para Instagram), una historia (1080 × 1920) y una horizontal (1920 × 1080), con el nombre y el escudo de {institution.name}, para que el liceo anuncie HaNet en sus redes.
        </p>
      </div>
      <ul className="flex gap-3 overflow-x-auto pb-2">
        {PROMO_SLIDES.map(slide => (
          <li key={slide.id} className="flex shrink-0 flex-col items-start gap-2">
            <div className="overflow-hidden rounded-(--radius-control) border border-(--border-subtle)" style={{ width: THUMB_HEIGHT * slide.width / slide.height, height: THUMB_HEIGHT }}>
              <div aria-hidden="true" style={{ width: slide.width, height: slide.height, transform: `scale(${THUMB_HEIGHT / slide.height})`, transformOrigin: 'top left' }}>
                {slide.render(data)}
              </div>
            </div>
            <Button variant="ghost" size="sm" loading={busy === slide.id} disabled={!!busy} onClick={() => void run(slide.id, exporter => exporter.downloadPromoSlide(data, slide.id))}>
              <Download aria-hidden="true" className="size-4" /> {slide.label}
            </Button>
          </li>
        ))}
      </ul>
      <Alert tone="danger" title="No se descargaron las imágenes" open={!!error}>{error}</Alert>
      <Button variant="secondary" loading={busy === 'zip'} disabled={!!busy} onClick={() => void run('zip', exporter => exporter.downloadPromoZip(data))} className="self-start">
        <FileArchive aria-hidden="true" className="size-4" /> Descargar todas (.zip)
      </Button>
    </section>
  )
}
