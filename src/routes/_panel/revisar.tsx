import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, PartyPopper } from 'lucide-react'
import { Alert } from '@/components/arc/alert/alert'
import { Badge } from '@/components/arc/badge/badge'
import { Button } from '@/components/arc/button/button'
import { EmptyState } from '@/components/arc/empty-state/empty-state'
import { Skeleton } from '@/components/arc/skeleton/skeleton'
import { getHall, listMyHalls, shortDateTime, type Hall, type HallTaskSummary } from '@/lib/classhall'
import { plural } from '@/lib/hnt-admin'
import { useLoad } from '@/lib/use-load'

export const Route = createFileRoute('/_panel/revisar')({
  component: ReviewInbox,
})

type Pending = { hall: Hall; task: HallTaskSummary }

// Todas las entregas por revisar de los Halls del docente, en una sola lista.
async function loadPending(): Promise<Pending[]> {
  const { halls } = await listMyHalls()
  const details = await Promise.all(halls.filter(hall => hall.isTeacher).map(hall => getHall(hall.id)))
  return details
    .flatMap(detail => (detail.tasks ?? []).map(task => ({ hall: detail.hall, task })))
    .filter(item => (item.task.pendingReviewCount ?? 0) > 0)
    // Primero lo que lleva más tiempo esperando: el plazo más antiguo.
    .sort((a, b) => a.task.dueAt - b.task.dueAt)
}

function ReviewInbox() {
  const { data, error, retry } = useLoad(loadPending, [], 'No pudimos cargar lo que tienes por revisar. Inténtalo nuevamente.')
  const total = data?.reduce((sum, item) => sum + (item.task.pendingReviewCount ?? 0), 0) ?? 0

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-(length:--text-3xl) leading-(--leading-display) font-medium tracking-(--tracking-display)">Por revisar</h1>
        <p className="text-(--text-secondary)">
          {data ? (total ? `${plural(total, 'entrega espera', 'entregas esperan')} tu revisión en ${plural(data.length, 'tarea', 'tareas')}.` : 'Las entregas de todos tus Halls, en un solo lugar.') : 'Las entregas de todos tus Halls, en un solo lugar.'}
        </p>
      </header>

      {error ? (
        <Alert tone="danger" title="No pudimos cargar la bandeja">{error}{' '}<Button variant="ghost" size="sm" onClick={retry}>Reintentar</Button></Alert>
      ) : !data ? (
        <Skeleton label="Cargando entregas por revisar" lines={5} />
      ) : data.length === 0 ? (
        <EmptyState icon={<PartyPopper />} title="No tienes entregas por revisar" description="Cuando un estudiante entregue una tarea, aparece aquí." />
      ) : (
        <ul className="flex flex-col divide-y divide-(--border-subtle) overflow-hidden rounded-(--radius-surface) bg-(--surface) shadow-(--shadow-raised)">
          {data.map(({ hall, task }) => (
            <li key={`${hall.id}-${task.id}`}>
              <Link
                to="/halls/$hallId/tareas/$taskId"
                params={{ hallId: hall.id, taskId: task.id }}
                className="group flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 transition-colors duration-(--duration-fast) hover:bg-(--surface-muted)"
              >
                <span className="flex min-w-0 flex-[1_1_16rem] flex-col gap-1">
                  <span className="truncate font-medium">{task.title}</span>
                  <span className="truncate text-(length:--text-sm) text-(--text-secondary)">
                    {hall.subject} · {hall.courseId} · hasta el {shortDateTime(task.dueAt)}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <Badge tone="info">{plural(task.pendingReviewCount ?? 0, 'por revisar', 'por revisar')}</Badge>
                  <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-(--text-muted) transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:text-(--accent) motion-reduce:transition-none" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
