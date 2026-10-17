import { createFileRoute } from '@tanstack/react-router'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/_panel/')({
  component: HomePage,
})

function HomePage() {
  const { user, role } = useAuth()
  const name = user?.displayName?.split(' ')[0]
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-large-title">{name ? `Hola, ${name}` : 'Hola'}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {role === 'HNT' && (
          <Card>
            <CardHeader>
              <CardTitle>Instituciones y miembros</CardTitle>
              <CardDescription>Instituciones, códigos de invitación, nóminas y roles.</CardDescription>
            </CardHeader>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Calendario del curso</CardTitle>
            <CardDescription>
              {role === 'Profesor' ? 'Confirmar la información que publica la directiva.' : 'Editar la agenda del curso.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
