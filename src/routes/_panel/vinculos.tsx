import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_panel/vinculos')({
  beforeLoad: ({ context }) => {
    if (context.auth.role !== 'admin') throw redirect({ to: '/' })
  },
  component: () => (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold">Vínculos de RUT</h1>
      <p className="text-muted-foreground">Próximamente: solicitudes pendientes de identityLinkRequests.</p>
    </div>
  ),
})
