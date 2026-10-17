import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_panel/instituciones')({
  // Las funciones admin* solo aceptan HNT; esto solo decide qué se dibuja.
  beforeLoad: ({ context }) => {
    if (context.auth.role !== 'HNT') throw redirect({ to: '/' })
  },
  component: Outlet,
})
