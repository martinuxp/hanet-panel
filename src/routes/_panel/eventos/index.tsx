import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, CalendarDays, Plus } from 'lucide-react'
import { Alert } from '@/components/arc/alert/alert'
import { Badge } from '@/components/arc/badge/badge'
import { Button } from '@/components/arc/button/button'
import { EmptyState } from '@/components/arc/empty-state/empty-state'
import { Skeleton } from '@/components/arc/skeleton/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/arc/tabs/tabs'
import { useAuth } from '@/lib/auth'
import { EVENT_CATEGORIES, eventDate, JORNADA_LABELS, listEvents, type EventKind, type HnEvent } from '@/lib/events'
import { plural } from '@/lib/hnt-admin'
import { useLoad } from '@/lib/use-load'

export const Route = createFileRoute('/_panel/eventos/')({
  validateSearch: (search: Record<string, unknown>): { tipo?: EventKind } =>
    search.tipo === 'regional' || search.tipo === 'institution' ? { tipo: search.tipo } : {},
  component: EventsPage,
})

function EventsPage() {
  const { role } = useAuth()
  const { tipo } = Route.useSearch()
  const navigate = Route.useNavigate()
  // Solo el equipo HaNet publica eventos de la ciudad.
  const kinds: EventKind[] = role === 'HNT' ? ['regional', 'institution'] : ['institution']
  const kind = tipo && kinds.includes(tipo) ? tipo : kinds[0]

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-(length:--text-3xl) leading-(--leading-display) font-medium tracking-(--tracking-display)">Eventos</h1>
        <p className="text-(--text-secondary)">Lo que publiques aquí aparece en la app, en Eventos.</p>
      </header>
      {kinds.length > 1 ? (
        <Tabs value={kind} onValueChange={value => void navigate({ search: { tipo: value as EventKind }, replace: true })}>
          <TabsList aria-label="Tipo de evento">
            <TabsTrigger value="regional">De la ciudad</TabsTrigger>
            <TabsTrigger value="institution">Del liceo</TabsTrigger>
          </TabsList>
          <TabsContent value="regional"><EventList kind="regional" /></TabsContent>
          <TabsContent value="institution"><EventList kind="institution" /></TabsContent>
        </Tabs>
      ) : (
        <EventList kind="institution" />
      )}
    </div>
  )
}

const categoryLabel = (value: string) => EVENT_CATEGORIES.find(item => item.value === value)?.label ?? 'Otro'

function EventList({ kind }: { kind: EventKind }) {
  const navigate = useNavigate()
  const { data, error, retry } = useLoad(() => listEvents(kind), [kind], 'No pudimos cargar los eventos. Inténtalo nuevamente.')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-(--text-secondary)">
          {kind === 'regional' ? 'Conciertos, ferias y obras de la ciudad. Pega el link de la ticketera para cargarlos.' : `Actividades de ${data?.institutionName ?? 'tu liceo'}, con inscripción si la necesitan.`}
        </p>
        {data?.canPublish && (
          <Button onClick={() => void navigate({ to: '/eventos/$eventId', params: { eventId: 'nuevo' }, search: { tipo: kind } })}>
            <Plus aria-hidden="true" className="size-4" /> {kind === 'regional' ? 'Nuevo evento de la ciudad' : 'Nuevo evento del liceo'}
          </Button>
        )}
      </div>
      {error ? (
        <Alert tone="danger" title="No pudimos cargar los eventos">{error}{' '}<Button variant="ghost" size="sm" onClick={retry}>Reintentar</Button></Alert>
      ) : !data ? (
        <Skeleton label="Cargando eventos" lines={4} />
      ) : data.events.length === 0 ? (
        <EmptyState icon={<CalendarDays />} title="No hay eventos próximos" description={kind === 'regional' ? 'Carga el primero desde el link de su ticketera.' : 'Publica la próxima actividad del liceo.'} />
      ) : (
        <ul className="flex flex-col divide-y divide-(--border-subtle) overflow-hidden rounded-(--radius-surface) bg-(--surface) shadow-(--shadow-raised)">
          {data.events.map(event => <EventRow key={event.id} event={event} />)}
        </ul>
      )}
    </div>
  )
}

function price(event: HnEvent) {
  if (event.isFree) return 'Gratis'
  return event.priceFrom ? `Desde $${event.priceFrom.toLocaleString('es-CL')}` : null
}

function EventRow({ event }: { event: HnEvent }) {
  const details = [
    eventDate(event.startsAt),
    event.venueName || null,
    event.kind === 'institution' ? JORNADA_LABELS[event.jornada] : price(event),
  ].filter(Boolean).join(' · ')
  return (
    <li>
      <Link
        to="/eventos/$eventId"
        params={{ eventId: event.id }}
        search={{ tipo: event.kind }}
        className="group flex items-center gap-4 px-5 py-4 transition-colors duration-(--duration-fast) hover:bg-(--surface-muted)"
      >
        <span className="hidden size-14 shrink-0 overflow-hidden rounded-(--radius-control) bg-(--surface-muted) sm:block">
          {event.imageUrl && <img src={event.imageUrl} alt="" className="size-full object-cover" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">{event.title}</span>
            <Badge size="sm">{categoryLabel(event.category)}</Badge>
          </span>
          <span className="truncate text-(length:--text-sm) text-(--text-secondary)">{details}</span>
        </span>
        {event.kind === 'institution' && event.signupMode !== 'none' && (
          <span className="shrink-0 text-(length:--text-sm) tabular-nums text-(--text-secondary)">
            {plural(event.signupCount ?? 0, 'inscrito', 'inscritos')}{event.capacity ? ` de ${event.capacity}` : ''}
          </span>
        )}
        <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-(--text-muted) transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:text-(--accent) motion-reduce:transition-none" />
      </Link>
    </li>
  )
}
