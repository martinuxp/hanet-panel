import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, CalendarClock, ClipboardList, FileText, Megaphone, Plus } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Badge } from '@/components/arc/badge/badge'
import { Button } from '@/components/arc/button/button'
import { CopyButton } from '@/components/arc/copy-button/copy-button'
import { EmptyState } from '@/components/arc/empty-state/empty-state'
import { Skeleton } from '@/components/arc/skeleton/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/arc/tabs/tabs'
import { BackLink } from '@/components/docente/back-link'
import { TaskDialog } from '@/components/docente/task-dialog'
import {
  DOCUMENT_LABELS, fileSize, getHall, hallThemeImage, PLAN_LABELS, shortDate, shortDateTime,
  type HallDetail, type HallTaskSummary,
} from '@/lib/classhall'
import { plural } from '@/lib/hnt-admin'
import { useLoad } from '@/lib/use-load'

export const Route = createFileRoute('/_panel/halls/$hallId/')({
  component: HallPage,
})

function HallPage() {
  const { hallId } = Route.useParams()
  const { data, error, retry } = useLoad(() => getHall(hallId), [hallId], 'No pudimos abrir este Hall. Inténtalo nuevamente.')
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

      <Tabs defaultValue="tareas">
        <TabsList aria-label="Secciones del Hall">
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
          <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="avisos">Avisos</TabsTrigger>
        </TabsList>
        <TabsContent value="tareas"><TasksPanel detail={data} onChanged={retry} /></TabsContent>
        <TabsContent value="evaluaciones"><EvaluationsPanel detail={data} /></TabsContent>
        <TabsContent value="documentos"><DocumentsPanel detail={data} /></TabsContent>
        <TabsContent value="avisos"><AnnouncementsPanel detail={data} /></TabsContent>
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
        <p className="text-(--text-secondary)">Abre una tarea para revisar sus entregas una tras otra.</p>
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
  if (evaluations.length === 0) {
    return <EmptyState icon={<CalendarClock />} title="Sin evaluaciones" description="Agenda evaluaciones desde la app. Salen aquí y en el Calendar del curso." />
  }
  return (
    <ul className={listClass}>
      {evaluations.map(evaluation => {
        const total = evaluation.contents.reduce((sum, row) => sum + row.points.reduce((a, b) => a + b, 0), 0)
        return (
          <li key={evaluation.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <span className="flex min-w-0 flex-col gap-1">
              <span className="font-medium">{evaluation.title}</span>
              <span className="text-(length:--text-sm) text-(--text-secondary)">
                {[shortDate(evaluation.date), evaluation.objectives.map(item => item.code).join(', ') || null].filter(Boolean).join(' · ')}
              </span>
            </span>
            <span className="flex items-center gap-2">
              {total > 0 && <Badge size="sm">{total} puntos</Badge>}
              {evaluation.exigency != null && <Badge size="sm">Exigencia {evaluation.exigency}%</Badge>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function DocumentsPanel({ detail }: { detail: HallDetail }) {
  const documents = detail.documents ?? []
  if (documents.length === 0) {
    return <EmptyState icon={<FileText />} title="Sin documentos" description="Las guías, presentaciones y PDF que compartas aparecen aquí." />
  }
  return (
    <ul className={listClass}>
      {documents.map(document => (
        <li key={document.id}>
          <a
            href={document.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-5 py-4 transition-colors duration-(--duration-fast) hover:bg-(--surface-muted)"
          >
            <FileText aria-hidden="true" className="size-5 shrink-0 text-(--accent)" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{document.name}</span>
              <span className="text-(length:--text-sm) text-(--text-secondary)">
                {[DOCUMENT_LABELS[document.kind], fileSize(document.size), document.evaluationId ? 'Tabla de especificaciones' : document.taskId ? 'Material de tarea' : null].filter(Boolean).join(' · ')}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

function AnnouncementsPanel({ detail }: { detail: HallDetail }) {
  if (detail.announcements.length === 0) {
    return <EmptyState icon={<Megaphone />} title="Sin avisos" description="Lo que publiques en el Hall lo ven todos sus estudiantes." />
  }
  return (
    <ul className={listClass}>
      {detail.announcements.map(item => (
        <li key={item.id} className="flex flex-col gap-2 px-5 py-4">
          <p className="whitespace-pre-line">{item.body}</p>
          <p className="text-(length:--text-sm) text-(--text-secondary)">
            {item.authorName}{item.createdAt ? ` · ${shortDate(item.createdAt)}` : ''}
          </p>
        </li>
      ))}
    </ul>
  )
}

