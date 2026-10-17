import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { AuthState } from '@/lib/auth'

export const Route = createRootRouteWithContext<{ auth: AuthState }>()({
  component: () => <Outlet />,
})
