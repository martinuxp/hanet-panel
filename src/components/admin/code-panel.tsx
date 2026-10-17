import { useState } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Button } from '@/components/arc/button/button'
import { CopyButton } from '@/components/arc/copy-button/copy-button'
import { Dialog, DialogContent } from '@/components/arc/dialog/dialog'
import { describeError } from '@/lib/errors'
import { rotateInviteCode, type AdminInstitution } from '@/lib/hnt-admin'
import { reloadInstitutions } from '@/lib/use-institutions'

function formatDate(millis: number) {
  return new Date(millis).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function CodePanel({ institution }: { institution: AdminInstitution }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // El backend guarda solo el hash: la frase se ve una vez, aquí.
  const [words, setWords] = useState<string[] | null>(null)

  const generate = async () => {
    setBusy(true)
    setError(null)
    try {
      setWords(await rotateInviteCode(institution.id))
      setConfirming(false)
      void reloadInstitutions()
    } catch (failure) {
      setError(describeError(failure, 'No pudimos generar el código.'))
    } finally {
      setBusy(false)
    }
  }

  // Cambiar el código deja fuera a quien todavía tenga el anterior.
  const ask = () => {
    setError(null)
    if (institution.hasInviteCode) setConfirming(true)
    else void generate()
  }

  const phrase = words?.join(' ') ?? ''

  return (
    <section className="flex flex-col gap-5 rounded-(--radius-surface) bg-(--surface) p-6 shadow-(--shadow-resting)">
      <div className="flex flex-col gap-1">
        <h2 className="text-(length:--text-lg) font-medium">Código de invitación</h2>
        <p className="text-(--text-secondary)">
          Con esta frase, las personas de la nómina se unen a {institution.name} desde la app.{' '}
          {institution.inviteUpdatedAt ? `El código actual se generó el ${formatDate(institution.inviteUpdatedAt)}.` : 'Todavía no tiene código.'}
        </p>
      </div>

      {words && (
        <div className="flex flex-col gap-3 rounded-(--radius-panel) bg-(--surface-muted) p-5">
          <p className="font-heading text-(length:--text-2xl) leading-(--leading-display) font-medium tracking-(--tracking-display)">{phrase}</p>
          <p className="text-(length:--text-sm) text-(--text-secondary)">Cópiala ahora: por seguridad no se puede volver a ver. Si se pierde, genera otra.</p>
          <CopyButton value={phrase} label="Copiar frase" className="self-start" />
        </div>
      )}

      <Alert tone="danger" title="No se generó el código" open={!!error && !confirming}>{error}</Alert>

      <Button variant={institution.hasInviteCode ? 'secondary' : 'primary'} onClick={ask} loading={busy && !confirming} className="self-start">
        {institution.hasInviteCode ? 'Cambiar código' : 'Generar código'}
      </Button>

      <Dialog open={confirming} onOpenChange={open => { if (!busy) setConfirming(open) }}>
        <DialogContent
          title={`¿Cambiar el código de ${institution.name}?`}
          description="El código actual dejará de funcionar de inmediato. Quienes ya se unieron no se ven afectados."
        >
          <div className="flex flex-col gap-4">
            <Alert tone="danger" title="No se generó el código" open={!!error}>{error}</Alert>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>Cancelar</Button>
              <Button onClick={() => void generate()} loading={busy}>Cambiar código</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
