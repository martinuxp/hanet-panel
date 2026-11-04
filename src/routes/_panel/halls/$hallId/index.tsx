import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, CalendarClock, ClipboardList, Plus } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Badge } from '@/components/arc/badge/badge'
import { Button } from '@/components/arc/button/button'
import { CopyButton } from '@/components/arc/copy-button/copy-button'
import { EmptyState } from '@/components/arc/empty-state/empty-state'
import { Skeleton } from '@/components/arc/skeleton/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/arc/tabs/tabs'
import { AnnouncementsPanel } from '@/components/docente/announcements-panel'
import { BackLink } from '@/components/docente/back-link'
import { DocumentsPanel } from '@/components/docente/documents-panel'
import { TaskDialog } from '@/components/docente/task-dialog'
import {
  getHall, hallThemeImage, PLAN_LABELS, shortDateTime,
  type HallDetail, type HallTaskSummary,
} from '@/lib/classhall'
import { plural } from '@/lib/hnt-admin'
import { useLoad } from '@/lib/use-load'

const TABS = ['tareas', 'evaluaciones', 'documentos', 'avisos'] as const
type Tab = (typeof TABS)[number]

export const Route = createFileRoute('/_panel/halls/$hallId/')({
  // La pestaña va en la dirección, para volver a ella desde una evaluación.
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } =>
    TABS.includes(search.tab as Tab) ? { tab: search.tab as Tab } : {},
  component: HallPage,
})

function HallPage() {
  const { hallId } = Route.useParams()
  const { tab = 'tareas' } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data, error, retry, refresh } = useLoad(() => getHall(hallId), [hallId], 'No pudimos abrir este Hall. Inténtalo nuevamente.')
  const back = <BackLink to="/halls">Mis Halls</BackLink>

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        {back}
        <Alert tone="danger" title="No pudimos abrir este Hall">
          {error}{' '}
          <Button variant="ghost" size="sm" onClick={retry}>Reintentar</Button>
        </Alert>
      </div>
    )
  }
  if (!data) return <div className="flex flex-col gap-6">{back}<Skeleton label="Cargando Hall" lines={4} /></div>

  const { hall } = data
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        {back}
        <div className="relative overflow-hidden rounded-(--radius-surface) bg-(--surface) shadow-(--shadow-raised)">
          <img src={hallThemeImage(hall.theme)} alt="" className="h-24 w-full object-cover sm:h-32" />
          <div className="flex flex-wrap items-end justify-between gap-4 p-5 sm:p-6">
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="font-heading text-(length:--text-3xl) leading-(--leading-display) font-medium tracking-(--tracking-display) text-balance">{hall.subject}</h1>
              <p className="text-(--text-secondary)">
                {[hall.courseId, PLAN_LABELS[hall.plan], hall.memberCount != null ? plural(hall.memberCount, 'estudiante', 'estudiantes') : null].filter(Boolean).join(' · ')}
              </p>
            </div>
            {hall.code && hall.plan !== 'comun' && (
              <div className="flex items-center gap-2">
                <span className="text-(length:--text-sm) text-(--text-secondary)">
                  Código <span className="font-medium tracking-wider text-(--foreground)">{hall.code}</span>
                </span>
                <CopyButton value={hall.code} label="Copiar" />
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={value => void navigate({ search: { tab: value as Tab }, replace: true })}>
        <TabsList aria-label="Secciones del Hall">
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
          <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="avisos">Avisos</TabsTrigger>
        </TabsList>
        <TabsContent value="tareas"><TasksPanel detail={data} onChanged={refresh} /></TabsContent>
        <TabsContent value="evaluaciones"><EvaluationsPanel detail={data} /></TabsContent>
        <TabsContent value="documentos"><DocumentsPanel detail={data} onChanged={refresh} /></TabsContent>
        <TabsContent value="avisos"><AnnouncementsPanel detail={data} onChanged={refresh} /></TabsContent>
      </Tabs>
    </div>
  )
}

const listClass = 'flex flex-col divide-y divide-(--border-subtle) overflow-hidden rounded-(--radius-surface) bg-(--surface) shadow-(--shadow-raised)'

function TasksPanel({ detail, onChanged }: { detail: HallDetail; onChanged: () => void }) {
  const [creating, setCreating] = useState(false)
  const tasks = [...(detail.tasks ?? [])].sort((a, b) => b.dueAt - a.dueAt)
  const expected = detail.expectedSubmissions ?? detail.hall.memberCount ?? null
  // Una sola marca de tiempo por render, para que todas las filas digan lo mismo.
  const [now] = useState(() => Date.now())

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-(--text-secondary)">Abre una tarea para revisar sus entregas una tras otra, o para editarla.</p>
        <Button onClick={() => setCreating(true)}><Plus aria-hidden="true" className="size-4" /> Nueva tarea</Button>
      </div>
      {tasks.length === 0 ? (
        <EmptyState icon={<ClipboardList />} title="Sin tareas todavía" description="Publica una tarea y revisa aquí lo que entreguen." />
      ) : (
        <ul className={listClass}>
          {tasks.map(task => <TaskRow key={task.id} hallId={detail.hall.id} task={task} expected={expected} now={now} />)}
        </ul>
      )}
      <TaskDialog hallId={detail.hall.id} open={creating} onOpenChange={setCreating} onSaved={onChanged} />
    </div>
  )
}

function TaskRow({ hallId, task, expected, now }: { hallId: string; task: HallTaskSummary; expected: number | null; now: number }) {
  const open = now <= task.dueAt
  const submitted = task.submittedCount ?? 0
  const share = expected ? Math.min(1, submitted / expected) : 0
  return (
    <li>
      <Link
        to="/halls/$hallId/tareas/$taskId"
        params={{ hallId, taskId: task.id }}
        className="group flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 transition-colors duration-(--duration-fast) hover:bg-(--surface-muted)"
      >
        <span className="flex min-w-0 flex-[1_1_16rem] flex-col gap-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">{task.title}</span>
            {open ? <Badge size="sm" tone="info">Abierta</Badge> : <Badge size="sm">Cerrada</Badge>}
            {(task.pendingReviewCount ?? 0) > 0 && <Badge size="sm">{task.pendingReviewCount} por revisar</Badge>}
          </span>
          <span className="text-(length:--text-sm) text-(--text-secondary)">
            Hasta el {shortDateTime(task.dueAt)}{task.acceptLate ? ' · recibe atrasadas' : ''}
          </span>
        </span>
        <span className="flex flex-[0_1_12rem] items-center gap-4">
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-(length:--text-sm) tabular-nums text-(--text-secondary)">
              {expected ? `${submitted} de ${expected} entregaron` : plural(submitted, 'entrega', 'entregas')}
            </span>
            {expected ? (
              <span className="h-1.5 overflow-hidden rounded-full bg-(--surface-muted)">
                <span className="block h-full rounded-full bg-(--accent)" style={{ width: `${share * 100}%` }} />
              </span>
            ) : null}
          </span>
          <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-(--text-muted) transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:text-(--accent) motion-reduce:transition-none" />
        </span>
      </Link>
    </li>
  )
}

function EvaluationsPanel({ detail }: { detail: HallDetail }) {
  const evaluations = [...detail.evaluations].sort((a, b) => a.date - b.date)
  const hallId = detail.hall.id
  const navigate = useNavigate()
  const [now] = useState(() => Date.now())
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-(--text-secondary)">Salen en el Hall y en el Calendar del curso. Puedes llenarlas desde la T.E.</p>
        <Button onClick={() => void navigate({ to: '/halls/$hallId/evaluaciones/$evaluationId', params: { hallId, evaluationId: 'nueva' } })}>
          <Plus aria-hidden="true" className="size-4" /> Nueva evaluación
        </Button>
      </div>
      {evaluations.length === 0 ? (
        <EmptyState icon={<CalendarClock />} title="Sin evaluaciones" description="Agenda una evaluación y sube su tabla de especificaciones." />
      ) : (
        <ul className={listClass}>
          {evaluations.map(evaluation => {
            const total = evaluation.contents.reduce((sum, row) => sum + row.points.reduce((a, b) => a + b, 0), 0)
            const hasSpec = (detail.documents ?? []).some(document => document.evaluationId === evaluation.id)
            return (
              <li key={evaluation.id}>
                <Link
                  to="/halls/$hallId/evaluaciones/$evaluationId"
                  params={{ hallId, evaluationId: evaluation.id }}
                  className="group flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors duration-(--duration-fast) hover:bg-(--surface-muted)"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium">{evaluation.title}</span>
                      {evaluation.date < now && <Badge size="sm">Pasada</Badge>}
                    </span>
                    <span className="text-(length:--text-sm) text-(--text-secondary)">
                      {[shortDateTime(evaluation.date), evaluation.objectives.map(item => item.code).filter(Boolean).join(', ') || null].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {total > 0 && <Badge size="sm">{total} puntos</Badge>}
                    {evaluation.exigency != null && <Badge size="sm">Exigencia {evaluation.exigency}%</Badge>}
                    {!hasSpec && <Badge size="sm" tone="warning">Sin T.E.</Badge>}
                    <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-(--text-muted) transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:text-(--accent) motion-reduce:transition-none" />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
