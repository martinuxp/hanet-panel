import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { TEACHER_ROLES } from '@/lib/nav'

export const Route = createFileRoute('/_panel/halls')({
  // El backend decide qué puede hacer cada uno; esto solo decide qué se dibuja.
  beforeLoad: ({ context }) => {
    if (!context.auth.role || !TEACHER_ROLES.includes(context.auth.role)) throw redirect({ to: '/' })
  },
  component: Outlet,
})
