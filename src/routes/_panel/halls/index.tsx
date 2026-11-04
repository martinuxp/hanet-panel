import { createFileRoute, Link } from '@tanstack/react-router'
import { CalendarClock, GraduationCap, Users } from 'lucide-react'
import { Alert } from '@/components/arc/alert/alert'
import { Badge } from '@/components/arc/badge/badge'
import { Button } from '@/components/arc/button/button'
import { CopyButton } from '@/components/arc/copy-button/copy-button'
import { EmptyState } from '@/components/arc/empty-state/empty-state'
import { Skeleton } from '@/components/arc/skeleton/skeleton'
import { hallThemeImage, listMyHalls, PLAN_LABELS, shortDate, type Hall } from '@/lib/classhall'
import { plural } from '@/lib/hnt-admin'
import { useLoad } from '@/lib/use-load'

export const Route = createFileRoute('/_panel/halls/')({
  component: HallsPage,
})

function HallsPage() {
  const { data, error, retry } = useLoad(listMyHalls, [], 'No pudimos cargar tus Halls. Inténtalo nuevamente.')
  const halls = data?.halls.filter(hall => hall.isTeacher) ?? []

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-(length:--text-3xl) leading-(--leading-display) font-medium tracking-(--tracking-display)">Mis Halls</h1>
        <p className="text-(--text-secondary)">Tus clases en ClassHall: tareas, entregas, evaluaciones y documentos.</p>
      </header>

      {error ? (
        <Alert tone="danger" title="No pudimos cargar tus Halls">
          {error}{' '}
          <Button variant="ghost" size="sm" onClick={retry}>Reintentar</Button>
        </Alert>
      ) : !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map(index => <Skeleton key={index} label="Cargando Halls" lines={3} />)}
        </div>
      ) : halls.length === 0 ? (
        <EmptyState
          icon={<GraduationCap />}
          title="Todavía no tienes Halls"
          description="Crea tu primer Hall desde ClassHall en la app. Aparece aquí al tiro."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {halls.map(hall => <HallCard key={hall.id} hall={hall} />)}
        </ul>
      )}
    </div>
  )
}

function HallCard({ hall }: { hall: Hall }) {
  return (
    <li className="group relative flex flex-col overflow-hidden rounded-(--radius-surface) bg-(--surface) shadow-(--shadow-raised) transition-colors duration-(--duration-fast) hover:bg-(--surface-muted)">
      <img src={hallThemeImage(hall.theme)} alt="" className="aspect-[4/1] w-full object-cover" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-col gap-1">
          <Link
            to="/halls/$hallId"
            params={{ hallId: hall.id }}
            className="truncate text-(length:--text-lg) font-medium after:absolute after:inset-0 after:content-['']"
          >
            {hall.subject}
          </Link>
          <p className="truncate text-(length:--text-sm) text-(--text-secondary)">{hall.courseId}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm">{PLAN_LABELS[hall.plan]}</Badge>
          {hall.memberCount != null && (
            <span className="inline-flex items-center gap-1 text-(length:--text-sm) text-(--text-secondary)">
              <Users aria-hidden="true" className="size-3.5" />
              {plural(hall.memberCount, 'estudiante', 'estudiantes')}
            </span>
          )}
        </div>
        {hall.nextEvaluation && (
          <p className="flex items-center gap-1.5 text-(length:--text-sm) text-(--text-secondary)">
            <CalendarClock aria-hidden="true" className="size-4 shrink-0 text-(--accent)" />
            <span className="truncate">{hall.nextEvaluation.title}, {shortDate(hall.nextEvaluation.date)}</span>
          </p>
        )}
        {hall.code && hall.plan !== 'comun' && (
          // Electivos y dominios se unen con el código. Va encima del link de la
          // tarjeta, para copiarlo sin entrar al Hall.
          <div className="relative z-10 mt-auto flex items-center justify-between gap-2 border-t border-(--border-subtle) pt-3">
            <span className="text-(length:--text-sm) text-(--text-secondary)">
              Código <span className="font-medium tracking-wider text-(--foreground)">{hall.code}</span>
            </span>
            <CopyButton value={hall.code} label="Copiar" variant="plain" />
          </div>
        )}
      </div>
    </li>
  )
}
