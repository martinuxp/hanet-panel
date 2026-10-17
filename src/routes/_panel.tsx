import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { Lock, LogOut } from 'lucide-react'
import { Avatar } from '@/components/arc/avatar/avatar'
import { Button } from '@/components/arc/button/button'
import { EmptyState } from '@/components/arc/empty-state/empty-state'
import { HanetLogo } from '@/components/brand/logo'
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
      <main className="flex min-h-svh items-center justify-center px-4">
        <EmptyState
          icon={<Lock />}
          title="Tu cuenta no tiene acceso al panel"
          description={`${user?.email ?? 'Esta cuenta'} no tiene un rol de docente, directiva o equipo HaNet. El equipo HaNet asigna los roles desde el Panel HNT.`}
          action={
            <Button variant="secondary" onClick={logout}>
              Cerrar sesión
            </Button>
          }
        />
      </main>
    )
  }

  const name = user?.displayName || user?.email || 'HaNet'

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-5 py-6">
          <HanetLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu className="gap-1">
              {navItems
                .filter((item) => item.roles.includes(role))
                .map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      className="h-10 rounded-(--radius-control) px-3 text-(length:--text-sm) text-(--text-secondary) data-[status=active]:bg-sidebar-accent data-[status=active]:text-(--foreground) data-[status=active]:[&_svg]:text-(--accent)"
                      render={<Link to={item.to} activeOptions={{ exact: true }} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="gap-3 p-4">
          <div className="flex items-center gap-3 px-1">
            <Avatar name={name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-(length:--text-sm)">{user?.email}</p>
              <p className="text-(length:--text-xs) text-(--text-muted)">{role}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="size-4" /> Cerrar sesión
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-(--background)">
        <header className="flex h-14 items-center px-4 md:hidden">
          <SidebarTrigger aria-label="Abrir menú" />
        </header>
        <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-10 md:py-12">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
