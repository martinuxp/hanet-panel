import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/_panel/')({
  component: HomePage,
})

function HomePage() {
  const { user, role } = useAuth()
  const name = user?.displayName?.split(' ')[0]
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading text-(length:--text-4xl) leading-(--leading-display) font-medium tracking-(--tracking-display)">
        {name ? `Hola, ${name}` : 'Hola'}
      </h1>
      <div className="grid gap-4 md:grid-cols-2">
        {role === 'HNT' && (
          <AreaLink to="/instituciones" title="Instituciones y miembros" description="Instituciones, códigos de invitación, nóminas y roles." />
        )}
        <AreaLink
          to="/calendario"
          title="Calendario del curso"
          description={role === 'Profesor' ? 'Confirma la información que publica la directiva.' : 'Edita la agenda del curso.'}
        />
      </div>
    </div>
  )
}

// Acceso a un área del panel: toda la tarjeta es el link.
function AreaLink({ to, title, description }: { to: '/instituciones' | '/calendario'; title: string; description: string }) {
  return (
    <Link
      to={to}
      className="group flex items-start justify-between gap-4 rounded-(--radius-surface) bg-(--surface) p-6 shadow-(--shadow-resting) transition-colors duration-(--duration-fast) hover:bg-(--surface-muted)"
    >
      <span className="flex flex-col gap-1">
        <span className="text-(length:--text-lg) font-medium">{title}</span>
        <span className="text-(--text-secondary)">{description}</span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="mt-1 size-5 shrink-0 text-(--text-muted) transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:text-(--accent) motion-reduce:transition-none"
      />
    </Link>
  )
}
