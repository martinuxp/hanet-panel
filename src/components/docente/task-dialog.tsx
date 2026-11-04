import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Button } from '@/components/arc/button/button'
import { Dialog, DialogContent } from '@/components/arc/dialog/dialog'
import { Input } from '@/components/arc/input/input'
import SegmentedControl from '@/components/arc/segmented-control/segmented-control'
import { Textarea } from '@/components/arc/textarea/textarea'
import { AttachmentField, type AttachmentState } from '@/components/docente/attachment-field'
import { applyAttachment } from '@/lib/attachments'
import { saveHallTask, type HallDocument, type HallTask } from '@/lib/classhall'
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

/** Publicar una tarea en el Hall, o editarla. Sale también en el Calendar del curso. */
export function TaskDialog({ hallId, open, onOpenChange, onSaved, task, attachment = null }: {
  hallId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  /** La tarea a editar. Sin ella, se publica una nueva. */
  task?: HallTask
  attachment?: HallDocument | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={task ? 'Editar tarea' : 'Nueva tarea'}
        description={task ? 'Los cambios se ven de inmediato en el Hall y en el Calendar del curso.' : 'Los estudiantes del Hall la ven de inmediato. También aparece en el Calendar del curso.'}
      >
        {/* Se monta de nuevo cada vez que se abre, con los datos de la tarea. */}
        {open && <TaskForm hallId={hallId} task={task} attachment={attachment} onCancel={() => onOpenChange(false)} onSaved={() => { onSaved(); onOpenChange(false) }} />}
      </DialogContent>
    </Dialog>
  )
}

function TaskForm({ hallId, task, attachment, onCancel, onSaved }: {
  hallId: string
  task?: HallTask
  attachment: HallDocument | null
  onCancel: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [instructions, setInstructions] = useState(task?.instructions ?? '')
  const [due, setDue] = useState(() => toLocalInput(task?.dueAt ?? nextWeekAt2359()))
  const [late, setLate] = useState(task?.acceptLate ? 'si' : 'no')
  const [file, setFile] = useState<AttachmentState>({ kind: 'keep' })
  const [fileProblem, setFileProblem] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Si la tarea nueva se guardó pero falló el archivo, reintentar no la duplica.
  const [savedId, setSavedId] = useState<string | undefined>(task?.id)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const dueAt = new Date(due).getTime()
    if (!title.trim()) return setError('Ponle un título a la tarea.')
    if (!Number.isFinite(dueAt)) return setError('Elige hasta cuándo se puede entregar.')
    setError(null)
    setSaving(true)
    let taskId = savedId
    try {
      taskId = await saveHallTask({ hallId, taskId, title: title.trim(), instructions: instructions.trim(), dueAt, acceptLate: late === 'si' })
    } catch (failure) {
      setSaving(false)
      return setError(describeError(failure, task ? 'No pudimos guardar los cambios. Inténtalo nuevamente.' : 'No pudimos publicar la tarea. Inténtalo nuevamente.'))
    }
    setSavedId(taskId)
    try {
      await applyAttachment(hallId, file, attachment, { taskId })
      onSaved()
    } catch (failure) {
      // La tarea ya quedó guardada; solo falló el archivo.
      setError(describeError(failure, 'La tarea quedó guardada, pero no pudimos subir el material. Edítala para intentarlo de nuevo.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Input id="task-title" label="Título" value={title} onChange={event => setTitle(event.target.value)} maxLength={80} required />
      <Textarea id="task-instructions" label="Instrucciones" description="Opcional." value={instructions} onChange={event => setInstructions(event.target.value)} rows={4} maxLength={3000} />
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
      <AttachmentField
        label="Material de la tarea (opcional)"
        current={attachment}
        state={file}
        onChange={setFile}
        problem={fileProblem}
        onProblem={setFileProblem}
      />
      <Alert tone="danger" title={task ? 'No se guardó' : 'No se publicó'} open={!!error}>{error}</Alert>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={saving}>{task ? 'Guardar cambios' : 'Publicar tarea'}</Button>
      </div>
    </form>
  )
}
