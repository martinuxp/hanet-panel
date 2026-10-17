import { createFileRoute } from '@tanstack/react-router'
import { CalendarCheck } from 'lucide-react'
import { Badge } from '@/components/arc/badge/badge'
import { EmptyState } from '@/components/arc/empty-state/empty-state'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/_panel/calendario')({
  component: CalendarPage,
})

function CalendarPage() {
  const { role, courseId } = useAuth()
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-(length:--text-3xl) leading-(--leading-display) font-medium tracking-(--tracking-display)">Calendario del curso</h1>
        {courseId && <Badge>{courseId}</Badge>}
      </div>
      <EmptyState
        icon={<CalendarCheck />}
        title="Próximamente"
        description={
          !courseId
            ? 'Tu cuenta no tiene un curso vinculado.'
            : role === 'Profesor'
              ? 'Aquí vas a confirmar los eventos que publica la directiva.'
              : 'Aquí vas a editar la agenda del curso.'
        }
      />
    </div>
  )
}
