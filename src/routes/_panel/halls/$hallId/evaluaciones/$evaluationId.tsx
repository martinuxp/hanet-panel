import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ClipboardList, FileText, Plus, ScanText, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Button } from '@/components/arc/button/button'
import { Input } from '@/components/arc/input/input'
import { Skeleton } from '@/components/arc/skeleton/skeleton'
import { Textarea } from '@/components/arc/textarea/textarea'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { FileDrop } from '@/components/common/file-drop'
import { BackLink } from '@/components/docente/back-link'
import {
  attachHallDocument, deleteHallDocument, deleteHallEvaluation, DOCUMENT_LABELS, fileSize, getHall, saveHallEvaluation,
  scanSpecTable, type HallDocument, type HallEvaluation, type SpecTableDraft,
} from '@/lib/classhall'
import { describeError } from '@/lib/errors'
import { documentProblem, SPEC_TABLE_TYPES, stageFile, type StagedFile } from '@/lib/uploads'
import { useLoad } from '@/lib/use-load'

export const Route = createFileRoute('/_panel/halls/$hallId/evaluaciones/$evaluationId')({
  component: EvaluationPage,
})

// Los mismos topes que saveHallEvaluation.
const MAX_SKILLS = 8
const MAX_CONTENTS = 12
const MAX_OBJECTIVES = 6
const DEFAULT_SKILLS = ['Conocimiento', 'Aplicación', 'Comprensión']

type Row = { name: string; detail: string; points: string[] }
type Form = {
  title: string
  date: string
  exigency: string
  objectives: { code: string; text: string }[]
  skills: string[]
  contents: Row[]
  prep: string
}

function two(value: number) {
  return String(value).padStart(2, '0')
}

function toLocalInput(ms: number) {
  const date = new Date(ms)
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`
}

function formFrom(evaluation: HallEvaluation | null): Form {
  if (!evaluation) {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    date.setHours(8, 0, 0, 0)
    return { title: '', date: toLocalInput(date.getTime()), exigency: '60', objectives: [], skills: [...DEFAULT_SKILLS], contents: [{ name: '', detail: '', points: DEFAULT_SKILLS.map(() => '') }], prep: '' }
  }
  return {
    title: evaluation.title,
    date: toLocalInput(evaluation.date),
    exigency: evaluation.exigency == null ? '' : String(evaluation.exigency),
    objectives: evaluation.objectives.map(item => ({ ...item })),
    skills: [...evaluation.skills],
    contents: evaluation.contents.map(row => ({ name: row.name, detail: row.detail, points: evaluation.skills.map((_, index) => (row.points[index] ? String(row.points[index]) : '')) })),
    prep: evaluation.prep,
  }
}

const cellClass = 'w-full min-w-0 rounded-(--radius-control) border border-(--border) bg-(--surface) px-2.5 py-1.5 text-(length:--text-sm) outline-none transition-colors duration-(--duration-fast) placeholder:text-(--text-muted) hover:border-(--border-strong) focus-visible:border-(--foreground)'

function EvaluationPage() {
  const { hallId, evaluationId } = Route.useParams()
  const { data, error, retry } = useLoad(() => getHall(hallId), [hallId], 'No pudimos abrir este Hall. Inténtalo nuevamente.')
  const navigate = useNavigate()
  const back = <BackLink to="/halls/$hallId" params={{ hallId }} search={{ tab: 'evaluaciones' }}>Volver al Hall</BackLink>
  const isNew = evaluationId === 'nueva'

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        {back}
        <Alert tone="danger" title="No pudimos abrir la evaluación">{error}{' '}<Button variant="ghost" size="sm" onClick={retry}>Reintentar</Button></Alert>
      </div>
    )
  }
  if (!data) return <div className="flex flex-col gap-6">{back}<Skeleton label="Cargando evaluación" lines={6} /></div>

  const evaluation = isNew ? null : data.evaluations.find(item => item.id === evaluationId) ?? null
  if (!isNew && !evaluation) {
    return <div className="flex flex-col gap-6">{back}<Alert tone="warning" title="Esa evaluación ya no existe">Puede que la hayan eliminado.</Alert></div>
  }
  const specTable = evaluation ? (data.documents ?? []).find(item => item.evaluationId === evaluation.id) ?? null : null

  return (
    <div className="flex flex-col gap-6">
      {back}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-(--text-secondary)">{data.hall.subject} · {data.hall.courseId}</p>
          <h1 className="font-heading text-(length:--text-3xl) leading-(--leading-display) font-medium tracking-(--tracking-display) text-balance">
            {evaluation ? evaluation.title : 'Nueva evaluación'}
          </h1>
        </div>
        {evaluation && data.hall.gradesOn !== false && (
          <Button variant="secondary" onClick={() => void navigate({ to: '/halls/$hallId/notas/$evaluationId', params: { hallId, evaluationId: evaluation.id } })}>
            <ClipboardList aria-hidden="true" className="size-4" /> {evaluation.gradesPublishedAt != null ? 'Ver notas' : 'Poner notas'}
          </Button>
        )}
      </header>
      <EvaluationForm hallId={hallId} evaluation={evaluation} specTable={specTable} />
    </div>
  )
}

function EvaluationForm({ hallId, evaluation, specTable }: { hallId: string; evaluation: HallEvaluation | null; specTable: HallDocument | null }) {
  const navigate = useNavigate()
  const [form, setForm] = useState<Form>(() => formFrom(evaluation))
  const [staged, setStaged] = useState<(StagedFile & { size: number }) | null>(null)
  const [removeSpec, setRemoveSpec] = useState(false)
  const [scan, setScan] = useState<{ state: 'idle' | 'uploading' | 'reading' } >({ state: 'idle' })
  const [warnings, setWarnings] = useState<string[]>([])
  const [specProblem, setSpecProblem] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const [savedId, setSavedId] = useState(evaluation?.id)

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm(current => ({ ...current, [key]: value }))
  const backToHall = () => navigate({ to: '/halls/$hallId', params: { hallId }, search: { tab: 'evaluaciones' } })

  async function pickSpec(file: File) {
    const problem = documentProblem(file, SPEC_TABLE_TYPES)
    setSpecProblem(problem)
    if (problem) return
    setScan({ state: 'uploading' })
    try {
      setStaged({ ...(await stageFile(file)), size: file.size })
      setRemoveSpec(false)
    } catch (failure) {
      setSpecProblem(describeError(failure, 'No pudimos subir la tabla. Inténtalo nuevamente.'))
    } finally {
      setScan({ state: 'idle' })
    }
  }

  async function readSpec() {
    if (!staged) return
    setScan({ state: 'reading' })
    setSpecProblem(null)
    try {
      fill(await scanSpecTable(hallId, staged.uploadPath))
    } catch (failure) {
      setSpecProblem(describeError(failure, 'No pudimos leer la tabla. Complétala a mano.'))
    } finally {
      setScan({ state: 'idle' })
    }
  }

  // Lo que se leyó llena el formulario, sin borrar lo que el docente ya escribió.
  function fill(draft: SpecTableDraft) {
    setForm(current => {
      const skills = draft.skills.length ? draft.skills.slice(0, MAX_SKILLS) : current.skills
      const time = current.date.slice(11) || '08:00'
      return {
        title: current.title.trim() || draft.title,
        date: draft.date ? `${draft.date}T${time}` : current.date,
        exigency: draft.exigency != null ? String(draft.exigency) : current.exigency,
        objectives: draft.objectives.length ? draft.objectives.slice(0, MAX_OBJECTIVES) : current.objectives,
        skills,
        contents: draft.contents.length
          ? draft.contents.slice(0, MAX_CONTENTS).map(row => ({ name: row.name, detail: row.detail, points: skills.map((_, index) => (row.points[index] ? String(row.points[index]) : '')) }))
          : current.contents,
        prep: current.prep.trim() || draft.prep,
      }
    })
    setWarnings(draft.warnings)
  }

  function setSkill(index: number, value: string) {
    set('skills', form.skills.map((skill, at) => (at === index ? value : skill)))
  }
  function addSkill() {
    setForm(current => ({ ...current, skills: [...current.skills, ''], contents: current.contents.map(row => ({ ...row, points: [...row.points, ''] })) }))
  }
  function removeSkill(index: number) {
    setForm(current => ({
      ...current,
      skills: current.skills.filter((_, at) => at !== index),
      contents: current.contents.map(row => ({ ...row, points: row.points.filter((_, at) => at !== index) })),
    }))
  }
  function setRow(index: number, patch: Partial<Row>) {
    set('contents', form.contents.map((row, at) => (at === index ? { ...row, ...patch } : row)))
  }

  const number = (value: string) => Math.max(0, Math.round(Number(value) || 0))
  const rowTotal = (row: Row) => row.points.reduce((sum, value) => sum + number(value), 0)
  const columnTotal = (index: number) => form.contents.reduce((sum, row) => sum + number(row.points[index] ?? ''), 0)
  const total = form.contents.reduce((sum, row) => sum + rowTotal(row), 0)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const date = new Date(form.date).getTime()
    const exigency = form.exigency.trim() === '' ? null : Math.round(Number(form.exigency))
    const skills = form.skills.map(skill => skill.trim())
    const contents = form.contents
      .filter(row => row.name.trim())
      .map(row => ({ name: row.name.trim(), detail: row.detail.trim(), points: skills.map((_, index) => number(row.points[index] ?? '')) }))
    if (form.title.trim().length < 2) return setError('Escribe el nombre de la evaluación.')
    if (!Number.isFinite(date)) return setError('Elige el día de la evaluación.')
    if (exigency !== null && (!Number.isFinite(exigency) || exigency < 1 || exigency > 100)) return setError('La exigencia va de 1 a 100 %.')
    if (contents.length > 0 && skills.some(skill => !skill)) return setError('Ponle nombre a cada habilidad de la tabla.')
    setError(null)
    setSaving(true)
    let id = savedId
    try {
      id = await saveHallEvaluation({
        hallId, evaluationId: id, title: form.title.trim(), date, exigency,
        skills: contents.length ? skills : skills.filter(Boolean),
        contents,
        objectives: form.objectives.map(item => ({ code: item.code.trim(), text: item.text.trim() })).filter(item => item.code || item.text),
        prep: form.prep.trim(),
      })
    } catch (failure) {
      setSaving(false)
      return setError(describeError(failure, 'No pudimos guardar la evaluación. Inténtalo nuevamente.'))
    }
    setSavedId(id)
    try {
      if (staged) await attachHallDocument(hallId, staged.uploadPath, staged.name, { evaluationId: id })
      else if (removeSpec && specTable) await deleteHallDocument(hallId, specTable.id)
      void backToHall()
    } catch (failure) {
      setError(describeError(failure, 'La evaluación quedó guardada, pero no pudimos adjuntar la tabla. Inténtalo nuevamente.'))
    } finally {
      setSaving(false)
    }
  }

  const shownSpec = staged
    ? { name: staged.name, detail: `${fileSize(staged.size)} · se adjunta al guardar` }
    : specTable && !removeSpec
      ? { name: specTable.name, detail: `${DOCUMENT_LABELS[specTable.kind]} · ${fileSize(specTable.size)}` }
      : null

  return (
    <form onSubmit={submit} noValidate className="flex min-w-0 flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised)">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">Tabla de especificaciones</h2>
          <p className="text-(length:--text-sm) text-(--text-secondary)">
            Sube la T.E. y HaNet llena el formulario por ti. Revisa lo que lea antes de guardar. Los estudiantes la ven en el Hall.
          </p>
        </div>
        {shownSpec ? (
          <div className="flex flex-wrap items-center gap-3 rounded-(--radius-control) border border-(--border) px-3 py-2.5">
            <FileText aria-hidden="true" className="size-5 shrink-0 text-(--accent)" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-(length:--text-sm) font-medium">{shownSpec.name}</span>
              <span className="truncate text-(length:--text-xs) text-(--text-secondary)">{shownSpec.detail}</span>
            </span>
            {staged && (
              <Button type="button" variant="secondary" size="sm" loading={scan.state === 'reading'} onClick={readSpec}>
                <ScanText aria-hidden="true" className="size-4" /> Llenar el formulario con la tabla
              </Button>
            )}
            <button
              type="button"
              aria-label={`Quitar ${shownSpec.name}`}
              onClick={() => { if (staged) setStaged(null); else setRemoveSpec(true); setWarnings([]) }}
              className="grid size-8 shrink-0 place-items-center rounded-(--radius-control) text-(--text-secondary) transition-colors duration-(--duration-fast) hover:bg-(--surface-muted) hover:text-(--foreground)"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        ) : (
          <FileDrop
            compact
            accept=".pdf,.docx,.jpg,.jpeg,.png"
            disabled={scan.state !== 'idle'}
            title={scan.state === 'uploading' ? 'Subiendo la tabla…' : 'Arrastra aquí la T.E.'}
            hint="PDF, Word (.docx) o foto, hasta 10 MB."
            onFiles={([file]) => void pickSpec(file)}
          />
        )}
        <Alert tone="danger" title="Con la tabla" open={!!specProblem}>{specProblem}</Alert>
        <Alert tone="warning" title="Revisa lo que se leyó" open={warnings.length > 0}>
          <ul className="list-disc pl-4">{warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>
        </Alert>
      </section>

      <section className="grid items-start gap-4 rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised) sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,8rem)]">
        <Input id="evaluacion-nombre" label="Nombre" value={form.title} onChange={event => set('title', event.target.value)} maxLength={80} required />
        <Input id="evaluacion-fecha" label="Día y hora" type="datetime-local" value={form.date} onChange={event => set('date', event.target.value)} required />
        <Input id="evaluacion-exigencia" label="Exigencia (%)" type="number" inputMode="numeric" min={1} max={100} value={form.exigency} onChange={event => set('exigency', event.target.value)} />
      </section>

      <section className="flex flex-col gap-3 rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised)">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">Objetivos de aprendizaje</h2>
          <Button type="button" variant="ghost" size="sm" disabled={form.objectives.length >= MAX_OBJECTIVES} onClick={() => set('objectives', [...form.objectives, { code: '', text: '' }])}>
            <Plus aria-hidden="true" className="size-4" /> Agregar objetivo
          </Button>
        </div>
        {form.objectives.length === 0 ? (
          <p className="text-(length:--text-sm) text-(--text-secondary)">Sin objetivos. Agrega los OA que mide la evaluación.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {form.objectives.map((objective, index) => (
              <li key={index} className="grid grid-cols-[6rem_minmax(0,1fr)_auto] items-start gap-2">
                <input aria-label={`Código del objetivo ${index + 1}`} placeholder="OA 3" value={objective.code} maxLength={40} className={cellClass}
                  onChange={event => set('objectives', form.objectives.map((item, at) => (at === index ? { ...item, code: event.target.value } : item)))} />
                <input aria-label={`Descripción del objetivo ${index + 1}`} placeholder="Qué se espera que logren" value={objective.text} maxLength={600} className={cellClass}
                  onChange={event => set('objectives', form.objectives.map((item, at) => (at === index ? { ...item, text: event.target.value } : item)))} />
                <IconButton label={`Quitar el objetivo ${index + 1}`} onClick={() => set('objectives', form.objectives.filter((_, at) => at !== index))} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex min-w-0 flex-col gap-3 rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised)">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-medium">Contenidos y puntajes</h2>
            <p className="text-(length:--text-sm) text-(--text-secondary)">Total: <span className="font-medium text-(--foreground) tabular-nums">{total} puntos</span></p>
          </div>
          <span className="flex flex-wrap gap-1">
            <Button type="button" variant="ghost" size="sm" disabled={form.skills.length >= MAX_SKILLS} onClick={addSkill}><Plus aria-hidden="true" className="size-4" /> Habilidad</Button>
            <Button type="button" variant="ghost" size="sm" disabled={form.contents.length >= MAX_CONTENTS}
              onClick={() => set('contents', [...form.contents, { name: '', detail: '', points: form.skills.map(() => '') }])}>
              <Plus aria-hidden="true" className="size-4" /> Contenido
            </Button>
          </span>
        </div>
        <div className="relative w-full max-w-full overflow-x-auto">
          <table className="w-full min-w-[44rem] border-separate border-spacing-1.5 text-(length:--text-sm)">
            <thead>
              <tr>
                <th scope="col" className="w-[26%] text-left font-medium text-(--text-secondary)">Contenido</th>
                <th scope="col" className="w-[18%] text-left font-medium text-(--text-secondary)">Detalle</th>
                {form.skills.map((skill, index) => (
                  <th key={index} scope="col" className="min-w-[8.5rem] font-normal">
                    <span className="flex items-center gap-0.5">
                      <input aria-label={`Habilidad ${index + 1}`} value={skill} maxLength={40} placeholder="Habilidad" className={`${cellClass} font-medium`} onChange={event => setSkill(index, event.target.value)} />
                      {form.skills.length > 1 && <IconButton small label={`Quitar la habilidad ${skill || index + 1}`} onClick={() => removeSkill(index)} />}
                    </span>
                  </th>
                ))}
                <th scope="col" className="w-16 text-right font-medium text-(--text-secondary)">Total</th>
                <th scope="col"><span className="sr-only">Quitar</span></th>
              </tr>
            </thead>
            <tbody>
              {form.contents.map((row, index) => (
                <tr key={index}>
                  <td><input aria-label={`Contenido ${index + 1}`} value={row.name} maxLength={80} placeholder="Función afín" className={cellClass} onChange={event => setRow(index, { name: event.target.value })} /></td>
                  <td><input aria-label={`Detalle del contenido ${index + 1}`} value={row.detail} maxLength={160} placeholder="Opcional" className={cellClass} onChange={event => setRow(index, { detail: event.target.value })} /></td>
                  {form.skills.map((skill, at) => (
                    <td key={at}>
                      <input aria-label={`Puntos de ${row.name || `contenido ${index + 1}`} en ${skill || `habilidad ${at + 1}`}`} type="number" inputMode="numeric" min={0} max={999}
                        value={row.points[at] ?? ''} placeholder="0" className={`${cellClass} text-right tabular-nums`}
                        onChange={event => setRow(index, { points: row.points.map((value, position) => (position === at ? event.target.value : value)) })} />
                    </td>
                  ))}
                  <td className="text-right font-medium tabular-nums">{rowTotal(row)}</td>
                  <td><IconButton label={`Quitar ${row.name || `el contenido ${index + 1}`}`} onClick={() => set('contents', form.contents.filter((_, at) => at !== index))} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={2} className="pt-1 text-left font-medium text-(--text-secondary)">Total por habilidad</th>
                {form.skills.map((_, index) => <td key={index} className="pt-1 pr-2.5 text-right tabular-nums text-(--text-secondary)">{columnTotal(index)}</td>)}
                <td className="pt-1 text-right font-medium tabular-nums">{total}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised)">
        <Textarea id="evaluacion-preparacion" label="Cómo prepararse" description="Opcional. Lo ven los estudiantes en el Hall." value={form.prep} onChange={event => set('prep', event.target.value)} maxLength={1500} rows={3} />
      </section>

      <Alert tone="danger" title="No se guardó" open={!!error}>{error}</Alert>
      <div className="flex flex-wrap items-center gap-2">
        {evaluation && (
          <Button type="button" variant="danger" onClick={() => setRemoving(true)}><Trash2 aria-hidden="true" className="size-4" /> Eliminar</Button>
        )}
        <span className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" onClick={() => void backToHall()}>Cancelar</Button>
          <Button type="submit" loading={saving}>{evaluation ? 'Guardar cambios' : 'Agendar evaluación'}</Button>
        </span>
      </div>
      <p className="text-(length:--text-xs) text-(--text-muted)">Al guardar, la evaluación aparece en el Calendar del curso con un bloque de 90 minutos.</p>

      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title="¿Eliminar la evaluación?"
        description="Sale del Hall y del Calendar del curso, junto con su tabla de especificaciones."
        confirmLabel="Eliminar"
        failure="No pudimos eliminar la evaluación. Inténtalo nuevamente."
        onConfirm={async () => {
          if (!evaluation) return
          await deleteHallEvaluation(hallId, evaluation.id)
          void backToHall()
        }}
      />
    </form>
  )
}

function IconButton({ label, onClick, small = false }: { label: string; onClick: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid shrink-0 place-items-center rounded-(--radius-control) text-(--text-secondary) transition-colors duration-(--duration-fast) hover:bg-(--surface-muted) hover:text-(--foreground) ${small ? 'size-7' : 'size-8'}`}
    >
      <X aria-hidden="true" className="size-4" />
    </button>
  )
}
