import { Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Button } from '@/components/arc/button/button'
import { FileDrop } from '@/components/common/file-drop'
import { InstitutionMark } from '@/components/admin/institution-mark'
import { describeError } from '@/lib/errors'
import { removeBrandingImage, uploadBrandingImage, type AdminInstitution, type BrandingKind } from '@/lib/hnt-admin'
import { updateInstitution } from '@/lib/use-institutions'

const MAX_BYTES = 15 * 1024 * 1024

/** Escudo y banner del liceo: salen en el inicio de la app, el vínculo de identidad y los correos. */
export function BrandingPanel({ institution }: { institution: AdminInstitution }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-(--text-secondary)">Se ven en el inicio de la app, al vincular la cuenta y en los correos de HaNet. No necesitan una versión nueva de la app.</p>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <BrandingSlot
          institution={institution}
          kind="logo"
          title="Escudo"
          hint="PNG con fondo transparente, cuadrado. Se guarda a 512 px."
          preview={<InstitutionMark institution={institution} size="lg" />}
          current={institution.logoUrl}
        />
        <BrandingSlot
          institution={institution}
          kind="banner"
          title="Banner"
          hint="Foto horizontal del liceo. Se guarda a 1600 px de ancho."
          preview={institution.bannerUrl ? <img src={institution.bannerUrl} alt="" className="aspect-[3/1] w-full rounded-(--radius-control) object-cover" /> : null}
          current={institution.bannerUrl}
        />
      </div>
    </div>
  )
}

function BrandingSlot({ institution, kind, title, hint, preview, current }: {
  institution: AdminInstitution
  kind: BrandingKind
  title: string
  hint: string
  preview: ReactNode
  current: string | null
}) {
  const [busy, setBusy] = useState<'subir' | 'quitar' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const key = kind === 'logo' ? 'logoUrl' : 'bannerUrl'

  async function upload(file: File) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return setError('Sube una imagen PNG, JPG o WebP.')
    if (file.size > MAX_BYTES) return setError('La imagen pesa más de 15 MB.')
    setBusy('subir')
    setError(null)
    try {
      updateInstitution(institution.id, { [key]: await uploadBrandingImage(institution.id, kind, file) })
    } catch (failure) {
      setError(describeError(failure, 'No pudimos subir la imagen. Inténtalo nuevamente.'))
    } finally {
      setBusy(null)
    }
  }

  async function remove() {
    setBusy('quitar')
    setError(null)
    try {
      await removeBrandingImage(institution.id, kind)
      updateInstitution(institution.id, { [key]: null })
    } catch (failure) {
      setError(describeError(failure, 'No pudimos quitar la imagen. Inténtalo nuevamente.'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised)">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium">{title}</h2>
        {current && (
          <Button variant="ghost" size="sm" loading={busy === 'quitar'} disabled={!!busy} onClick={remove}>
            <Trash2 aria-hidden="true" className="size-4" /> Quitar
          </Button>
        )}
      </div>
      {preview}
      <FileDrop
        compact
        accept="image/png,image/jpeg,image/webp"
        disabled={!!busy}
        title={busy === 'subir' ? 'Subiendo…' : current ? `Reemplazar ${title.toLowerCase()}` : `Arrastra aquí el ${title.toLowerCase()}`}
        hint={hint}
        onFiles={([file]) => void upload(file)}
      />
      <Alert tone="danger" title="No se guardó" open={!!error}>{error}</Alert>
    </section>
  )
}
