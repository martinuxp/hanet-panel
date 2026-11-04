import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { EVENT_ROLES } from '@/lib/nav'

export const Route = createFileRoute('/_panel/eventos')({
  beforeLoad: ({ context }) => {
    if (!context.auth.role || !EVENT_ROLES.includes(context.auth.role)) throw redirect({ to: '/' })
  },
  component: Outlet,
})
