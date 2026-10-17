import { createFileRoute, redirect } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { EmptyState } from '@/components/arc/empty-state/empty-state'

export const Route = createFileRoute('/_panel/instituciones')({
  beforeLoad: ({ context }) => {
    if (context.auth.role !== 'HNT') throw redirect({ to: '/' })
  },
  component: () => (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading text-(length:--text-3xl) leading-(--leading-display) font-medium tracking-(--tracking-display)">Instituciones y miembros</h1>
      <EmptyState
        icon={<Building2 />}
        title="Próximamente"
        description="Lo mismo que el Panel HNT de la app: instituciones, códigos de invitación, nóminas y roles."
      />
    </div>
  ),
})
