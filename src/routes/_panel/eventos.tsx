import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_panel/eventos')({
  component: () => (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold">Eventos del curso</h1>
      <p className="text-muted-foreground">Próximamente: verificación de eventos del HaNet Calendar.</p>
    </div>
  ),
})
