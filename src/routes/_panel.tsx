import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { useAuth } from '@/lib/auth'
import { navItems } from '@/lib/nav'

export const Route = createFileRoute('/_panel')({
  beforeLoad: ({ context }) => {
    if (!context.auth.user) throw redirect({ to: '/login' })
  },
  component: PanelLayout,
})

function PanelLayout() {
  const { user, role, logout } = useAuth()

  if (!role) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
        <h1 className="text-2xl font-semibold">Tu cuenta no tiene acceso al panel</h1>
        <p className="max-w-md text-muted-foreground">
          {user?.email} todavía no tiene rol de admin o docente. Pídele a un administrador de HaNet que te lo asigne.
        </p>
        <Button variant="secondary" onClick={logout}>
          Cerrar sesión
        </Button>
      </main>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-4 py-5 text-xl font-semibold">
          <span>
            HaNet <span className="text-primary">Panel</span>
          </span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {navItems
                .filter((item) => item.roles.includes(role))
                .map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton render={<Link to={item.to} activeOptions={{ exact: true }} />}>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="gap-2 p-4">
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          <p className="text-xs uppercase tracking-wide text-primary">{role}</p>
          <Button variant="ghost" className="justify-start" onClick={logout}>
            <LogOut /> Cerrar sesión
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
