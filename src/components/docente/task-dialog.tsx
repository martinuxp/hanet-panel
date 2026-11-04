import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Button } from '@/components/arc/button/button'
import { Dialog, DialogContent } from '@/components/arc/dialog/dialog'
import { Input } from '@/components/arc/input/input'
import SegmentedControl from '@/components/arc/segmented-control/segmented-control'
import { Textarea } from '@/components/arc/textarea/textarea'
import { saveHallTask } from '@/lib/classhall'
import { describeError } from '@/lib/errors'

// datetime-local trabaja en hora local, sin zona: "2026-11-12T23:59".
function toLocalInput(ms: number) {
  const date = new Date(ms)
  const two = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`
}

function nextWeekAt2359() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  date.setHours(23, 59, 0, 0)
  return date.getTime()
}

/** Publicar una tarea en el Hall. Sale también en el Calendar del curso. */
export function TaskDialog({ hallId, open, onOpenChange, onSaved }: {
  hallId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [due, setDue] = useState(() => toLocalInput(nextWeekAt2359()))
  const [late, setLate] = useState('no')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const dueAt = new Date(due).getTime()
    if (!title.trim()) return setError('Ponle un título a la tarea.')
    if (!Number.isFinite(dueAt)) return setError('Elige hasta cuándo se puede entregar.')
    setError(null)
    setSaving(true)
    try {
      await saveHallTask({ hallId, title: title.trim(), instructions: instructions.trim(), dueAt, acceptLate: late === 'si' })
      setTitle('')
      setInstructions('')
      onSaved()
      onOpenChange(false)
    } catch (failure) {
      setError(describeError(failure, 'No pudimos publicar la tarea. Inténtalo nuevamente.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Nueva tarea" description="Los estudiantes del Hall la ven de inmediato. También aparece en el Calendar del curso.">
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <Input id="task-title" label="Título" value={title} onChange={event => setTitle(event.target.value)} maxLength={120} required />
          <Textarea id="task-instructions" label="Instrucciones" description="Opcional." value={instructions} onChange={event => setInstructions(event.target.value)} rows={4} />
          <Input id="task-due" label="Se entrega hasta" type="datetime-local" value={due} onChange={event => setDue(event.target.value)} required />
          <div className="flex flex-col gap-2">
            <span className="text-(length:--text-sm) font-medium">Después del plazo</span>
            <SegmentedControl
              label="Después del plazo"
              value={late}
              onValueChange={setLate}
              options={[{ value: 'no', label: 'No recibe más' }, { value: 'si', label: 'Recibe atrasadas' }]}
            />
          </div>
          <Alert tone="danger" title="No se publicó" open={!!error}>{error}</Alert>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Publicar tarea</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
