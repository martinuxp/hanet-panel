import { createFileRoute, useBlocker } from '@tanstack/react-router'
import { ClipboardPaste, Eye, Send, Users } from 'lucide-react'
import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Badge } from '@/components/arc/badge/badge'
import { Button } from '@/components/arc/button/button'
import { Dialog, DialogContent } from '@/components/arc/dialog/dialog'
import { EmptyState } from '@/components/arc/empty-state/empty-state'
import { Skeleton } from '@/components/arc/skeleton/skeleton'
import { Textarea } from '@/components/arc/textarea/textarea'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { FileDrop } from '@/components/common/file-drop'
import { BackLink } from '@/components/docente/back-link'
import { shortDate, shortDateTime } from '@/lib/classhall'
import { describeError } from '@/lib/errors'
import {
  average, formatGrade, getEvaluationGrades, parseGrade, parsePastedGrades, PASSING_GRADE, publishEvaluationGrades,
  saveEvaluationGrades, type EvaluationGrades, type GradeStudent, type PasteResult,
} from '@/lib/grades'
import { plural } from '@/lib/hnt-admin'
import { useLoad } from '@/lib/use-load'

export const Route = createFileRoute('/_panel/halls/$hallId/notas/$evaluationId')({
  component: GradesPage,
})

function GradesPage() {
  const { hallId, evaluationId } = Route.useParams()
  const { data, error, retry, refresh } = useLoad(() => getEvaluationGrades(hallId, evaluationId), [hallId, evaluationId], 'No pudimos abrir las notas. Inténtalo nuevamente.')
  const back = <BackLink to="/halls/$hallId" params={{ hallId }} search={{ tab: 'evaluaciones' }}>Volver al Hall</BackLink>

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        {back}
        <Alert tone="danger" title="No pudimos abrir las notas">{error}{' '}<Button variant="ghost" size="sm" onClick={retry}>Reintentar</Button></Alert>
      </div>
    )
  }
  if (!data) return <div className="flex flex-col gap-6">{back}<Skeleton label="Cargando notas" lines={8} avatar /></div>

  return (
    <div className="flex flex-col gap-6">
      {back}
      <GradeSheet key={data.evaluation.id} hallId={hallId} data={data} onSaved={refresh} />
    </div>
  )
}

const cellClass = 'w-16 rounded-(--radius-control) border border-(--border) bg-(--surface) px-2 py-1.5 text-center text-(length:--text-sm) tabular-nums outline-none transition-colors duration-(--duration-fast) placeholder:text-(--text-muted) hover:border-(--border-strong) focus-visible:border-(--foreground) aria-invalid:border-(--danger) aria-invalid:text-(--danger)'

const textFrom = (grade: number | null) => (grade == null ? '' : formatGrade(grade))

function GradeSheet({ hallId, data, onSaved }: { hallId: string; data: EvaluationGrades; onSaved: () => Promise<void> | void }) {
  const { evaluation, students } = data
  const [texts, setTexts] = useState<Record<string, string>>(() => Object.fromEntries(students.map(student => [student.uid, textFrom(student.grade)])))
  const [weight, setWeight] = useState(evaluation.weight == null ? '' : String(evaluation.weight))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pasting, setPasting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const parsed = useMemo(() => Object.fromEntries(students.map(student => [student.uid, parseGrade(texts[student.uid] ?? '')])), [students, texts])
  const changes = students.filter(student => parsed[student.uid] !== 'invalid' && parsed[student.uid] !== student.grade)
  const invalid = students.filter(student => parsed[student.uid] === 'invalid')
  const weightValue = weight.trim() === '' ? null : Number(weight)
  const weightInvalid = weightValue != null && (!Number.isInteger(weightValue) || weightValue < 1 || weightValue > 100)
  const weightChanged = !weightInvalid && weightValue !== evaluation.weight
  const dirty = changes.length > 0 || weightChanged
  const valid = students.map(student => parsed[student.uid]).filter((grade): grade is number => typeof grade === 'number')
  const drafts = students.filter(student => student.status === 'draft').length
  const multiCourse = new Set(students.map(student => student.courseId)).size > 1
  const mean = average(valid)
  const failing = valid.filter(grade => grade < PASSING_GRADE).length

  useBlocker({
    shouldBlockFn: () => dirty && !window.confirm('Tienes notas sin guardar. ¿Salir de todas formas?'),
    enableBeforeUnload: () => dirty,
  })

  function moveFrom(index: number, event: KeyboardEvent<HTMLInputElement>) {
    const step = event.key === 'Enter' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = inputs.current[index + step]
    next?.focus()
    next?.select()
  }

  async function save(): Promise<boolean> {
    if (invalid.length) {
      setError(`Revisa ${plural(invalid.length, 'nota', 'notas')}: van de 1,0 a 7,0, con un decimal.`)
      inputs.current[students.indexOf(invalid[0])]?.focus()
      return false
    }
    if (weightInvalid) {
      setError('La ponderación es un número entero entre 1 y 100.')
      return false
    }
    if (!dirty) return true
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      await saveEvaluationGrades(hallId, evaluation.id, changes.map(student => ({ uid: student.uid, grade: parsed[student.uid] as number | null })), weightChanged ? weightValue : undefined)
      setNotice(evaluation.published && changes.some(student => parsed[student.uid] != null)
        ? 'Guardado. Quienes tienen una nota nueva o cambiada reciben un aviso.'
        : 'Guardado en borrador. Nadie lo ve hasta que publiques.')
      await onSaved()
      return true
    } catch (problem) {
      setError(describeError(problem, 'No pudimos guardar las notas. Inténtalo nuevamente.'))
      return false
    } finally {
      setSaving(false)
    }
  }

  function applyPaste(result: PasteResult) {
    setTexts(current => ({ ...current, ...Object.fromEntries(result.matches.map(match => [match.uid, textFrom(match.grade)])) }))
    setNotice(`Pegamos ${plural(result.matches.length, 'nota', 'notas')}. Revísalas y guarda.`)
  }

  const statusOf = (student: GradeStudent) => {
    const value = parsed[student.uid]
    if (value === 'invalid') return <Badge size="sm" tone="danger">No es una nota</Badge>
    if (value !== student.grade) return <Badge size="sm" tone="warning">Sin guardar</Badge>
    if (student.grade == null) return null
    if (student.status === 'draft') return <Badge size="sm">Borrador</Badge>
    return student.seen
      ? <span className="inline-flex items-center gap-1 text-(length:--text-sm) text-(--text-secondary)"><Eye aria-hidden="true" className="size-3.5" /> La vio</span>
      : <span className="text-(length:--text-sm) text-(--text-muted)">Publicada</span>
  }

  const seen = students.filter(student => student.status === 'published' && student.seen).length
  const published = students.filter(student => student.status === 'published').length

  return (
    <>
      <header className="flex flex-col gap-1">
        <p className="text-(--text-secondary)">Notas · {shortDateTime(evaluation.date)}</p>
        <h1 className="font-heading text-(length:--text-3xl) leading-(--leading-display) font-medium tracking-(--tracking-display) text-balance">{evaluation.title}</h1>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Con nota" value={`${valid.length} de ${students.length}`} />
        <Stat label="Promedio" value={mean == null ? '—' : formatGrade(mean)} />
        <Stat label={`Bajo ${formatGrade(PASSING_GRADE)}`} value={String(failing)} />
        <Stat label="La vieron" value={evaluation.published ? `${seen} de ${published}` : '—'} />
      </dl>

      {evaluation.published ? (
        <Alert tone="success" title={`Publicadas el ${shortDate(evaluation.publishedAt ?? evaluation.date)}`}>
          Si agregas o cambias una nota, al guardar queda publicada y ese estudiante recibe un aviso.{drafts > 0 && ` Quedan ${plural(drafts, 'nota', 'notas')} en borrador.`}
        </Alert>
      ) : (
        <Alert tone="info" title="En borrador">Nadie ve estas notas hasta que las publiques. Cada estudiante recibe un aviso, sin la nota, y la raspa en la app.</Alert>
      )}
      {data.withoutAccount > 0 && (
        <Alert tone="warning" title={`${plural(data.withoutAccount, 'estudiante', 'estudiantes')} sin cuenta`}>
          Están en la nómina del curso pero todavía no entran a HaNet, así que no aparecen aquí. Su nota sigue en el libro de clases.
        </Alert>
      )}

      {students.length === 0 ? (
        <EmptyState icon={<Users />} title="Todavía no hay estudiantes" description="Cuando entren al Hall, aparecen aquí para ponerles nota." />
      ) : (
        <section className="flex flex-col gap-4 rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised)">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="font-medium">Notas de 1,0 a 7,0</h2>
              <p className="text-(length:--text-sm) text-(--text-secondary)">Escribe 6,2 o 62. Enter pasa al siguiente. Deja vacío para borrar.</p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-(length:--text-sm)">
                <span className="text-(--text-secondary)">Ponderación</span>
                <span className="flex items-center gap-1.5">
                  <input className={cellClass} inputMode="numeric" value={weight} placeholder="—" aria-invalid={weightInvalid || undefined} onChange={event => setWeight(event.target.value.replace(/[^\d]/g, '').slice(0, 3))} />
                  <span className="text-(--text-secondary)">%</span>
                </span>
              </label>
              <Button variant="secondary" onClick={() => setPasting(true)}><ClipboardPaste aria-hidden="true" className="size-4" /> Pegar desde planilla</Button>
            </div>
          </div>

          <div className="relative w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-(--border-subtle) text-(length:--text-sm) text-(--text-secondary)">
                  <th scope="col" className="w-10 py-2 pr-3 font-normal">N°</th>
                  <th scope="col" className="py-2 pr-3 font-normal">Estudiante</th>
                  {multiCourse && <th scope="col" className="py-2 pr-3 font-normal">Curso</th>}
                  <th scope="col" className="w-20 py-2 pr-3 text-center font-normal">Nota</th>
                  <th scope="col" className="w-32 py-2 font-normal"><span className="sr-only">Estado</span></th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.uid} className="border-b border-(--border-subtle) last:border-0">
                    <td className="py-1.5 pr-3 text-(length:--text-sm) tabular-nums text-(--text-muted)">{index + 1}</td>
                    <td className="py-1.5 pr-3"><label htmlFor={`nota-${student.uid}`}>{student.name}</label></td>
                    {multiCourse && <td className="py-1.5 pr-3 text-(length:--text-sm) text-(--text-secondary)">{student.courseId}</td>}
                    <td className="py-1.5 pr-3 text-center">
                      <input
                        id={`nota-${student.uid}`}
                        ref={element => { inputs.current[index] = element }}
                        className={cellClass}
                        inputMode="decimal"
                        autoComplete="off"
                        value={texts[student.uid] ?? ''}
                        aria-invalid={parsed[student.uid] === 'invalid' || undefined}
                        onChange={event => setTexts(current => ({ ...current, [student.uid]: event.target.value.slice(0, 4) }))}
                        onBlur={() => {
                          const value = parsed[student.uid]
                          if (typeof value === 'number') setTexts(current => ({ ...current, [student.uid]: formatGrade(value) }))
                        }}
                        onKeyDown={event => moveFrom(index, event)}
                      />
                    </td>
                    <td className="py-1.5">{statusOf(student)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Alert tone="danger" title="No se guardó" open={!!error}>{error}</Alert>
      <Alert tone="success" title={notice ?? ''} open={!!notice && !error} />

      {(dirty || !evaluation.published || drafts > 0) && students.length > 0 && <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-(--radius-surface) bg-(--surface) px-5 py-3 shadow-(--shadow-floating)">
        <span className="text-(length:--text-sm) text-(--text-secondary)" aria-live="polite">
          {dirty ? `${plural(changes.length + (weightChanged && changes.length === 0 ? 1 : 0), 'cambio', 'cambios')} sin guardar` : 'Todo guardado'}
        </span>
        <span className="ml-auto flex flex-wrap gap-2">
          {dirty && (
            <Button variant="ghost" disabled={saving} onClick={() => { setTexts(Object.fromEntries(students.map(student => [student.uid, textFrom(student.grade)]))); setWeight(evaluation.weight == null ? '' : String(evaluation.weight)); setError(null) }}>
              Descartar
            </Button>
          )}
          <Button variant={evaluation.published && drafts === 0 ? 'primary' : 'secondary'} loading={saving} disabled={!dirty} onClick={() => void save()}>
            {evaluation.published ? 'Guardar' : 'Guardar borrador'}
          </Button>
          {(!evaluation.published || drafts > 0) && (
            <Button disabled={saving || valid.length === 0} onClick={() => { if (invalid.length || weightInvalid) void save(); else setPublishing(true) }}>
              <Send aria-hidden="true" className="size-4" /> Publicar notas
            </Button>
          )}
        </span>
      </div>}

      <PasteDialog open={pasting} onOpenChange={setPasting} students={students} onApply={applyPaste} />
      <ConfirmDialog
        open={publishing}
        onOpenChange={setPublishing}
        tone="primary"
        title="¿Publicar las notas?"
        description={`${plural(valid.length, 'estudiante recibe', 'estudiantes reciben')} un aviso y ve su nota en la app. ${valid.length < students.length ? `${plural(students.length - valid.length, 'queda', 'quedan')} sin nota; puedes agregarlas después.` : ''}`.trim()}
        confirmLabel="Publicar"
        failure="No pudimos publicar las notas. Inténtalo nuevamente."
        onConfirm={async () => {
          if (!(await save())) throw new Error('save')
          const { published: count } = await publishEvaluationGrades(hallId, evaluation.id)
          setNotice(`Publicamos ${plural(count, 'nota', 'notas')}. Ya les llegó el aviso.`)
          await onSaved()
        }}
      />
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-(--radius-surface) bg-(--surface) px-4 py-3 shadow-(--shadow-raised)">
      <dt className="text-(length:--text-sm) text-(--text-secondary)">{label}</dt>
      <dd className="font-heading text-(length:--text-2xl) font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function PasteDialog({ open, onOpenChange, students, onApply }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  students: GradeStudent[]
  onApply: (result: PasteResult) => void
}) {
  const [text, setText] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const result = useMemo(() => parsePastedGrades(text, students), [text, students])
  const change = (next: boolean) => {
    if (!next) { setText(''); setFileError(null) }
    onOpenChange(next)
  }

  async function readFile(file: File) {
    setFileError(null)
    if (!/\.(csv|txt|tsv)$/i.test(file.name)) {
      setFileError('Sube un CSV. Desde Excel: Archivo, Guardar como, CSV.')
      return
    }
    setText(await file.text())
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent title="Pegar notas desde una planilla" description="Copia las columnas de nombre y nota desde Excel o Sheets, o solo la columna de notas en el orden de la lista.">
        <div className="flex flex-col gap-4">
          <Textarea id="pegar-notas" label="Notas" value={text} onChange={event => setText(event.target.value)} rows={8} placeholder={'Agustina Bravo Leiva\t6,2\nMartín Cárdenas Ojeda\t5,4'} />
          <FileDrop compact accept=".csv,.txt,.tsv" title="O suelta un CSV" onFiles={files => void readFile(files[0])} />
          <Alert tone="danger" title="Ese archivo no sirve" open={!!fileError}>{fileError}</Alert>
          {text.trim() && (
            <div className="flex flex-col gap-2 text-(length:--text-sm)" aria-live="polite">
              <p>
                {result.matches.length === 0 ? 'No encontramos notas.' : `${plural(result.matches.length, 'nota', 'notas')} ${result.mode === 'names' ? 'por nombre' : 'en el orden de la lista'}.`}
              </p>
              {result.problems.length > 0 && (
                <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-(--radius-control) bg-(--surface-muted) p-3">
                  {result.problems.map(problem => (
                    <li key={problem.line}><span className="text-(--text-muted)">Línea {problem.line}:</span> {problem.text} <span className="text-(--danger)">{problem.reason}</span></li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => change(false)}>Cancelar</Button>
            <Button disabled={result.matches.length === 0} onClick={() => { onApply(result); change(false) }}>Usar {result.matches.length > 0 ? plural(result.matches.length, 'nota', 'notas') : 'notas'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
