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
import { HanetLogo, HanetMark } from '@/components/hanet/logo'
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
        <HanetMark className="h-10" />
        <h1 className="text-title2 text-balance">Tu cuenta no tiene acceso al panel</h1>
        <p className="max-w-md text-hn-text-secondary">
          {user?.email} no tiene un rol con acceso al panel. El equipo HaNet asigna los roles desde el Panel HNT.
        </p>
        <Button variant="surface" onClick={logout}>
          Cerrar sesión
        </Button>
      </main>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-5 py-6">
          <HanetLogo />
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
        <SidebarFooter className="gap-3 p-4">
          <div className="flex flex-col gap-0.5 rounded-hn-md bg-sidebar-accent px-4 py-3">
            <p className="truncate text-callout">{user?.email}</p>
            <p className="text-caption text-hn-text-secondary">{role}</p>
          </div>
          <Button variant="surface" size="sm" onClick={logout}>
            <LogOut /> Cerrar sesión
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 px-4 md:hidden">
          <SidebarTrigger aria-label="Abrir menú" />
        </header>
        <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
