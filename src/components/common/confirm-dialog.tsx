import { useState } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Button } from '@/components/arc/button/button'
import { Dialog, DialogContent } from '@/components/arc/dialog/dialog'
import { describeError } from '@/lib/errors'

/** Pide confirmar algo que no se puede deshacer, como eliminar o publicar. */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm, failure, tone = 'danger' }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => Promise<unknown>
  /** Qué decir si falla y el backend no explica por qué. */
  failure: string
  /** `primary` para confirmar algo que no es destructivo, como publicar. */
  tone?: 'danger' | 'primary'
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (problem) {
      setError(describeError(problem, failure))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={next => { if (!busy) { setError(null); onOpenChange(next) } }}>
      <DialogContent title={title} description={description}>
        <div className="flex flex-col gap-4">
          <Alert tone="danger" title="No se pudo completar" open={!!error}>{error}</Alert>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button variant={tone} loading={busy} onClick={confirm}>{confirmLabel}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
