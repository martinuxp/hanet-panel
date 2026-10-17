import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Building2, CalendarCheck, Check, KeyRound, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/arc/badge/badge'
import { Skeleton } from '@/components/arc/skeleton/skeleton'
import { InstitutionMark } from '@/components/admin/institution-mark'
import { useAuth, type PanelRole } from '@/lib/auth'
import { plural, type AdminInstitution } from '@/lib/hnt-admin'
import { useInstitutions } from '@/lib/use-institutions'

export const Route = createFileRoute('/_panel/')({
  component: HomePage,
})

const ROLE_LABEL: Record<PanelRole, string> = {
  HNT: 'Equipo HaNet',
  Admin: 'Administración',
  Profesor: 'Docente',
  Directiva: 'Directiva de curso',
  CEE: 'Centro de estudiantes',
}

function today() {
  const text = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toLocaleUpperCase('es') + text.slice(1)
}

function HomePage() {
  const { user, role, courseId } = useAuth()
  const name = user?.displayName?.split(' ')[0]
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <p className="text-(--text-secondary)">
          {today()}{role ? ` · ${ROLE_LABEL[role]}` : ''}{courseId && role !== 'HNT' ? ` · ${courseId}` : ''}
        </p>
        <h1 className="font-heading text-(length:--text-4xl) leading-(--leading-display) font-medium tracking-(--tracking-display) text-balance">
          {name ? `Hola, ${name}` : 'Hola'}
        </h1>
      </header>
      {role === 'HNT' ? <HntHome /> : null}
      <StaffHome role={role} courseId={courseId} />
    </div>
  )
}

function HntHome() {
  const { institutions, loaded, error } = useInstitutions()

  if (!loaded) return error ? <p className="text-(--danger)">{error}</p> : <Skeleton label="Cargando resumen" lines={5} />

  const people = institutions.reduce((sum, item) => sum + item.rosterCount, 0)
  const todo = [
    ...institutions.filter(item => item.rosterCount === 0).map(item => ({ item, kind: 'roster' as const })),
    ...institutions.filter(item => !item.hasInviteCode).map(item => ({ item, kind: 'code' as const })),
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section className="flex flex-col gap-5 rounded-(--radius-surface) bg-(--surface) p-6 shadow-(--shadow-raised)">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-(length:--text-lg) font-medium">Personas en nómina</h2>
          <p className="text-(length:--text-sm) text-(--text-secondary)">
            {plural(people, 'persona', 'personas')} en {plural(institutions.length, 'institución', 'instituciones')}
          </p>
        </div>
        {institutions.length === 0
          ? <p className="text-(--text-secondary)">Aún no hay instituciones. Crea la primera desde <Link to="/instituciones" className="text-(--accent) underline underline-offset-2">Instituciones</Link>.</p>
          : <RosterBars institutions={institutions} />}
      </section>

      <section className="flex flex-col gap-4 rounded-(--radius-surface) bg-(--surface) p-6 shadow-(--shadow-raised)">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-(length:--text-lg) font-medium">Por hacer</h2>
          {todo.length > 0 && <Badge tone="warning" size="sm">{todo.length}</Badge>}
        </div>
        {todo.length === 0 ? (
          <p className="flex items-center gap-2 text-(--text-secondary)">
            <Check aria-hidden="true" className="size-4 text-(--success)" />
            Todas las instituciones tienen nómina y código.
          </p>
        ) : (
          <ul className="-mx-2 flex flex-col">
            {todo.slice(0, 6).map(({ item, kind }) => (
              <li key={`${kind}-${item.id}`}>
                <Link
                  to="/instituciones/$institutionId"
                  params={{ institutionId: item.id }}
                  className="group flex items-center gap-3 rounded-(--radius-control) px-2 py-2.5 transition-colors duration-(--duration-fast) hover:bg-(--surface-muted)"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-(--accent-subtle) text-(--accent)">
                    {kind === 'code' ? <KeyRound aria-hidden="true" className="size-4" /> : <Users aria-hidden="true" className="size-4" />}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{kind === 'code' ? 'Generar código' : 'Cargar nómina'}</span>
                    <span className="truncate text-(length:--text-sm) text-(--text-secondary)">{item.name}</span>
                  </span>
                  <ArrowRight aria-hidden="true" className="ml-auto size-4 shrink-0 text-(--text-muted) transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:text-(--accent) motion-reduce:transition-none" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

// Cuánta gente tiene cada institución en su nómina, de mayor a menor.
function RosterBars({ institutions }: { institutions: AdminInstitution[] }) {
  const sorted = [...institutions].sort((a, b) => b.rosterCount - a.rosterCount).slice(0, 6)
  const max = Math.max(1, ...sorted.map(item => item.rosterCount))
  return (
    <ul className="flex flex-col gap-1">
      {sorted.map(item => (
        <li key={item.id}>
          <Link
            to="/instituciones/$institutionId"
            params={{ institutionId: item.id }}
            className="-mx-2 grid grid-cols-[auto_minmax(0,1fr)_3.5rem] items-center gap-x-3 gap-y-1.5 rounded-(--radius-control) px-2 py-2 transition-colors duration-(--duration-fast) hover:bg-(--surface-muted)"
          >
            <InstitutionMark institution={item} size="sm" />
            <span className="flex min-w-0 flex-col gap-1.5">
              <span className="flex items-center gap-2">
                <span className="truncate font-medium">{item.name}</span>
                {!item.hasInviteCode && <Badge tone="warning" size="sm">Sin código</Badge>}
              </span>
              <span className="h-1.5 overflow-hidden rounded-full bg-(--surface-muted)">
                <span
                  className="block h-full rounded-full bg-(--accent) transition-[width] duration-(--duration-slow) ease-(--ease-enter)"
                  style={{ width: `${item.rosterCount === 0 ? 0 : Math.max(4, (item.rosterCount / max) * 100)}%` }}
                />
              </span>
            </span>
            <span className="text-right text-(length:--text-sm) tabular-nums text-(--text-secondary)">{item.rosterCount.toLocaleString('es-CL')}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function StaffHome({ role, courseId }: { role: PanelRole | null; courseId: string | null }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {role === 'HNT' && (
        <AreaLink
          to="/instituciones"
          icon={<Building2 aria-hidden="true" className="size-5" />}
          title="Instituciones y miembros"
          description="Códigos de invitación, nóminas y roles."
        />
      )}
      <AreaLink
        to="/calendario"
        icon={<CalendarCheck aria-hidden="true" className="size-5" />}
        title="Calendario del curso"
        description={role === 'Profesor'
          ? 'Confirma las evaluaciones que publica la directiva.'
          : `Edita la agenda de ${courseId ?? 'tu curso'}.`}
      />
    </div>
  )
}

// Acceso a un área del panel: toda la tarjeta es el link.
function AreaLink({ to, icon, title, description }: { to: '/instituciones' | '/calendario'; icon: ReactNode; title: string; description: string }) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-4 rounded-(--radius-surface) bg-(--surface) p-6 shadow-(--shadow-raised) transition-colors duration-(--duration-fast) hover:bg-(--surface-muted)"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-(--accent-subtle) text-(--accent)">{icon}</span>
      <span className="flex flex-1 flex-col gap-1">
        <span className="text-(length:--text-lg) font-medium">{title}</span>
        <span className="text-(--text-secondary)">{description}</span>
      </span>
      <ArrowRight aria-hidden="true" className="mt-1 size-5 shrink-0 text-(--text-muted) transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:text-(--accent) motion-reduce:transition-none" />
    </Link>
  )
}
