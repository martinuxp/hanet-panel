import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/_panel/calendario')({
  component: CalendarPage,
})

function CalendarPage() {
  const { role, courseId } = useAuth()
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-title1">Calendario del curso</h1>
      <p className="text-hn-text-secondary">
        {courseId ? `Curso: ${courseId}. ` : 'Tu cuenta no tiene un curso vinculado. '}
        {role === 'Profesor'
          ? 'Próximamente: confirmar los eventos que publica la directiva.'
          : 'Próximamente: editar la agenda del curso.'}
      </p>
    </div>
  )
}
