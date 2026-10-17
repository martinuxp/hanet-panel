import { createFileRoute } from '@tanstack/react-router'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/_panel/')({
  component: HomePage,
})

function HomePage() {
  const { role } = useAuth()
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Hola 👋</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle>Vínculos de RUT</CardTitle>
              <CardDescription>Aprobar o rechazar las solicitudes de vínculo de estudiantes.</CardDescription>
            </CardHeader>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Eventos del curso</CardTitle>
            <CardDescription>Verificar la información de evaluaciones y clases.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
