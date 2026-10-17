import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_panel/instituciones')({
  beforeLoad: ({ context }) => {
    if (context.auth.role !== 'HNT') throw redirect({ to: '/' })
  },
  component: () => (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold">Instituciones y miembros</h1>
      <p className="text-muted-foreground">
        Próximamente: lo mismo que el Panel HNT de la app (instituciones, códigos de invitación, nóminas y roles).
      </p>
    </div>
  ),
})
