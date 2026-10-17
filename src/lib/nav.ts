import { CalendarCheck, LayoutDashboard, UserCheck, type LucideIcon } from 'lucide-react'
import type { PanelRole } from '@/lib/auth'

export type NavItem = {
  to: '/' | '/vinculos' | '/eventos'
  label: string
  icon: LucideIcon
  roles: PanelRole[]
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, roles: ['admin', 'docente'] },
  { to: '/vinculos', label: 'Vínculos de RUT', icon: UserCheck, roles: ['admin'] },
  { to: '/eventos', label: 'Eventos del curso', icon: CalendarCheck, roles: ['admin', 'docente'] },
]
