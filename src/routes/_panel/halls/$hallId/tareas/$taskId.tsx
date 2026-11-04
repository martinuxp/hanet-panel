import { createFileRoute } from '@tanstack/react-router'
import { ArrowDown, ArrowUp, Check, ExternalLink, FileText, Inbox, Link2, PartyPopper } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Avatar } from '@/components/arc/avatar/avatar'
import { Badge } from '@/components/arc/badge/badge'
import { Button } from '@/components/arc/button/button'
import { EmptyState } from '@/components/arc/empty-state/empty-state'
import SegmentedControl from '@/components/arc/segmented-control/segmented-control'
import { Skeleton } from '@/components/arc/skeleton/skeleton'
import { Textarea } from '@/components/arc/textarea/textarea'
import { BackLink } from '@/components/docente/back-link'
import {
  DOCUMENT_LABELS, fileSize, getHallTask, reviewHallSubmission, shortDateTime,
  type HallSubmission, type SubmissionItem,
} from '@/lib/classhall'
import { describeError } from '@/lib/errors'
import { useLoad } from '@/lib/use-load'

export const Route = createFileRoute('/_panel/halls/$hallId/tareas/$taskId')({
  component: ReviewPage,
})

type Filter = 'pendientes' | 'revisadas' | 'todas'

// Primero lo que falta revisar, de la entrega más antigua a la más nueva:
// el orden en que se corrige un montón de papeles.
function byQueue(a: HallSubmission, b: HallSubmission) {
  if (a.reviewed !== b.reviewed) return a.reviewed ? 1 : -1
  return (a.submittedAt ?? 0) - (b.submittedAt ?? 0)
}

function ReviewPage() {
  const { hallId, taskId } = Route.useParams()
  const { data, setData, error, retry } = useLoad(() => getHallTask(hallId, taskId), [hallId, taskId], 'No pudimos abrir esta tarea. Inténtalo nuevamente.')
  const [filter, setFilter] = useState<Filter>('pendientes')
  const [selectedUid, setSelectedUid] = useState<string | null>(null)

  const submissions = useMemo(() => [...(data?.submissions ?? [])].sort(byQueue), [data])
  const pending = submissions.filter(item => !item.reviewed)
  const visible = filter === 'pendientes' ? pending : filter === 'revisadas' ? submissions.filter(item => item.reviewed) : submissions
  const selected = visible.find(item => item.uid === selectedUid) ?? visible[0] ?? null

  const move = useCallback((step: 1 | -1) => {
    if (!selected) return
    const index = visible.findIndex(item => item.uid === selected.uid)
    const next = visible[index + step]
    if (next) setSelectedUid(next.uid)
  }, [selected, visible])

  const replace = useCallback((updated: HallSubmission) => {
    setData(current => current && { ...current, submissions: current.submissions?.map(item => (item.uid === updated.uid ? updated : item)) })
  }, [setData])

  const back = <BackLink to="/halls/$hallId" params={{ hallId }}>Volver al Hall</BackLink>

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        {back}
        <Alert tone="danger" title="No pudimos abrir esta tarea">
          {error}{' '}
          <Button variant="ghost" size="sm" onClick={retry}>Reintentar</Button>
        </Alert>
      </div>
    )
  }
  if (!data) return <div className="flex flex-col gap-6">{back}<Skeleton label="Cargando entregas" lines={6} avatar /></div>

  const { task } = data
  const expected = data.expectedSubmissions ?? null
  const missing = expected != null ? Math.max(0, expected - submissions.length) : null
  const reviewedCount = submissions.length - pending.length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {back}
        <header className="flex flex-col gap-1">
          <p className="text-(--text-secondary)">{data.subject}</p>
          <h1 className="font-heading text-(length:--text-3xl) leading-(--leading-display) font-medium tracking-(--tracking-display) text-balance">{task.title}</h1>
          <p className="text-(--text-secondary)">Hasta el {shortDateTime(task.dueAt)}{task.acceptLate ? ' · recibe atrasadas' : ''}</p>
        </header>
        <Progress reviewed={reviewedCount} submitted={submissions.length} missing={missing} />
      </div>

      {submissions.length === 0 ? (
        <EmptyState icon={<Inbox />} title="Nadie ha entregado todavía" description="Cuando lleguen entregas, las revisas aquí una tras otra." />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-6">
            <SegmentedControl
              label="Qué entregas mostrar"
              value={filter}
              onValueChange={value => setFilter(value as Filter)}
              options={[
                { value: 'pendientes', label: `Por revisar ${pending.length}` },
                { value: 'revisadas', label: `Revisadas ${reviewedCount}` },
                { value: 'todas', label: 'Todas' },
              ]}
            />
            {visible.length === 0 ? (
              <p className="px-1 py-3 text-(length:--text-sm) text-(--text-secondary)">
                {filter === 'pendientes' ? 'No queda nada por revisar.' : 'Todavía no revisas ninguna.'}
              </p>
            ) : (
              <ul className="flex max-h-[40vh] flex-col gap-0.5 overflow-y-auto rounded-(--radius-surface) bg-(--surface) p-1.5 shadow-(--shadow-raised) lg:max-h-[calc(100svh-12rem)]">
                {visible.map(item => (
                  <li key={item.uid}>
                    <button
                      type="button"
                      onClick={() => setSelectedUid(item.uid)}
                      aria-current={item.uid === selected?.uid ? 'true' : undefined}
                      className="flex w-full items-center gap-3 rounded-(--radius-control) px-2.5 py-2 text-left transition-colors duration-(--duration-fast) hover:bg-(--surface-muted) aria-[current=true]:bg-(--accent-subtle)"
                    >
                      <Avatar name={item.studentName} size="sm" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-(length:--text-sm) font-medium">{item.studentName}</span>
                        <span className="truncate text-(length:--text-xs) text-(--text-secondary)">
                          {item.submittedAt ? shortDateTime(item.submittedAt) : 'Entregada'}{item.late ? ' · atrasada' : ''}
                        </span>
                      </span>
                      {item.reviewed && <Check aria-label="Revisada" className="size-4 shrink-0 text-(--success)" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {selected ? (
            <SubmissionPanel
              key={selected.uid}
              hallId={hallId}
              taskId={taskId}
              submission={selected}
              position={visible.findIndex(item => item.uid === selected.uid)}
              total={visible.length}
              onMove={move}
              onSaved={(updated, advance) => {
                replace(updated)
                if (!advance) return
                // Seguir con la siguiente por revisar, sin volver a la lista.
                const index = pending.findIndex(item => item.uid === updated.uid)
                const next = pending[index + 1] ?? pending.find(item => item.uid !== updated.uid)
                if (next) setSelectedUid(next.uid)
                else if (filter === 'pendientes') setSelectedUid(null)
              }}
            />
          ) : (
            <EmptyState icon={<PartyPopper />} title="Revisaste todas las entregas" description="Si llega otra, aparece en «Por revisar»." />
          )}
        </div>
      )}
    </div>
  )
}

function Progress({ reviewed, submitted, missing }: { reviewed: number; submitted: number; missing: number | null }) {
  const share = submitted ? reviewed / submitted : 0
  return (
    <div className="flex flex-col gap-2 rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised)">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p>
          <span className="text-(length:--text-2xl) font-medium tabular-nums">{reviewed}</span>
          <span className="text-(--text-secondary)"> de {submitted} revisadas</span>
        </p>
        {missing != null && (
          <p className="text-(length:--text-sm) text-(--text-secondary)">
            {missing === 0 ? 'Entregó todo el Hall' : `${missing} ${missing === 1 ? 'estudiante aún no entrega' : 'estudiantes aún no entregan'}`}
          </p>
        )}
      </div>
      <span className="h-1.5 overflow-hidden rounded-full bg-(--surface-muted)">
        <span className="block h-full rounded-full bg-(--accent) transition-[width] duration-(--duration-slow) ease-(--ease-enter)" style={{ width: `${share * 100}%` }} />
      </span>
    </div>
  )
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

function SubmissionPanel({ hallId, taskId, submission, position, total, onMove, onSaved }: {
  hallId: string
  taskId: string
  submission: HallSubmission
  position: number
  total: number
  onMove: (step: 1 | -1) => void
  onSaved: (updated: HallSubmission, advance: boolean) => void
}) {
  const [feedback, setFeedback] = useState(submission.feedback)
  const [saving, setSaving] = useState<'review' | 'comment' | 'undo' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const dirty = feedback.trim() !== submission.feedback.trim()
  const saveRef = useRef<() => void>(() => {})

  async function save(kind: 'review' | 'comment' | 'undo') {
    setSaving(kind)
    setError(null)
    try {
      const reviewed = kind === 'review' ? true : kind === 'undo' ? false : submission.reviewed
      const updated = await reviewHallSubmission(hallId, taskId, submission.uid, reviewed, feedback.trim())
      onSaved(updated, kind === 'review')
    } catch (failure) {
      setError(describeError(failure, 'No pudimos guardar la revisión. Inténtalo nuevamente.'))
    } finally {
      setSaving(null)
    }
  }
  useEffect(() => {
    saveRef.current = () => { if (!saving) void save('review') }
  })

  // J/K o flechas para moverse; Ctrl/⌘ + Enter guarda y sigue.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        saveRef.current()
        return
      }
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === 'j' || event.key === 'ArrowDown') { event.preventDefault(); onMove(1) }
      if (event.key === 'k' || event.key === 'ArrowUp') { event.preventDefault(); onMove(-1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onMove])

  const images = submission.items.filter((item): item is Extract<SubmissionItem, { kind: 'file' }> => item.kind === 'file' && item.fileKind === 'image')
  const others = submission.items.filter(item => !(item.kind === 'file' && item.fileKind === 'image'))

  return (
    <section aria-label={`Entrega de ${submission.studentName}`} className="flex min-w-0 flex-col gap-6 rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised) sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={submission.studentName} size="lg" />
          <div className="flex min-w-0 flex-col">
            <h2 className="truncate text-(length:--text-lg) font-medium">{submission.studentName}</h2>
            <p className="text-(length:--text-sm) text-(--text-secondary)">
              {[submission.courseId, submission.submittedAt ? `Entregó el ${shortDateTime(submission.submittedAt)}` : null].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {submission.late && <Badge size="sm" tone="warning">Atrasada</Badge>}
          {submission.reviewed && <Badge size="sm" tone="success">Revisada</Badge>}
          {total > 1 && (
            <span className="flex items-center gap-1">
              <Button variant="ghost" size="sm" aria-label="Entrega anterior" disabled={position <= 0} onClick={() => onMove(-1)}><ArrowUp className="size-4" /></Button>
              <span className="text-(length:--text-xs) tabular-nums text-(--text-secondary)">{position + 1}/{total}</span>
              <Button variant="ghost" size="sm" aria-label="Entrega siguiente" disabled={position >= total - 1} onClick={() => onMove(1)}><ArrowDown className="size-4" /></Button>
            </span>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div className={`grid gap-3 ${images.length > 1 ? 'sm:grid-cols-2' : ''}`}>
          {images.map(item => (
            <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-(--radius-control) border border-(--border-subtle) bg-(--background)">
              <img src={item.url} alt={item.name} className="max-h-[28rem] w-full object-contain transition-opacity duration-(--duration-fast) group-hover:opacity-90" />
            </a>
          ))}
        </div>
      )}

      {others.length > 0 && (
        <ul className="flex flex-col gap-2">
          {others.map(item => (
            <li key={item.id}>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-(--radius-control) border border-(--border) px-4 py-3 transition-colors duration-(--duration-fast) hover:bg-(--surface-muted)"
              >
                {item.kind === 'link'
                  ? <Link2 aria-hidden="true" className="size-5 shrink-0 text-(--accent)" />
                  : <FileText aria-hidden="true" className="size-5 shrink-0 text-(--accent)" />}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{item.name}</span>
                  <span className="truncate text-(length:--text-sm) text-(--text-secondary)">
                    {item.kind === 'link' ? new URL(item.url).hostname : `${DOCUMENT_LABELS[item.fileKind]} · ${fileSize(item.size)}`}
                  </span>
                </span>
                <ExternalLink aria-hidden="true" className="size-4 shrink-0 text-(--text-muted) group-hover:text-(--foreground)" />
              </a>
            </li>
          ))}
        </ul>
      )}

      {submission.items.length === 0 && <p className="text-(--text-secondary)">Esta entrega no trae archivos.</p>}

      {submission.note && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-(length:--text-sm) font-medium text-(--text-secondary)">Comentario del estudiante</h3>
          <p className="whitespace-pre-line rounded-(--radius-control) bg-(--surface-muted) px-4 py-3">{submission.note}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-(--border-subtle) pt-5">
        <Textarea
          id={`feedback-${submission.uid}`}
          label="Tu comentario para el estudiante"
          description="Solo lo ve este estudiante. Opcional."
          placeholder="Qué hizo bien y qué revisar."
          value={feedback}
          onChange={event => setFeedback(event.target.value)}
          maxLength={1000}
          rows={3}
        />
        <Alert tone="danger" title="No se guardó" open={!!error}>{error}</Alert>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="hidden text-(length:--text-xs) text-(--text-muted) lg:block">
            <kbd className="font-sans">Ctrl</kbd> o <kbd className="font-sans">⌘</kbd> + <kbd className="font-sans">Enter</kbd> guarda y sigue · <kbd className="font-sans">J</kbd> / <kbd className="font-sans">K</kbd> para moverte
          </p>
          <div className="ml-auto flex flex-wrap justify-end gap-2">
            {submission.reviewed ? (
              <>
                <Button variant="ghost" loading={saving === 'undo'} disabled={!!saving} onClick={() => save('undo')}>Volver a «Por revisar»</Button>
                <Button variant="secondary" loading={saving === 'comment'} disabled={!dirty || !!saving} onClick={() => save('comment')}>Guardar comentario</Button>
              </>
            ) : (
              <Button loading={saving === 'review'} disabled={!!saving} onClick={() => save('review')}>
                {dirty ? 'Guardar y marcar revisada' : 'Marcar como revisada'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
