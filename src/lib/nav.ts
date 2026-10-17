import { Building2, CalendarCheck, LayoutDashboard, type LucideIcon } from 'lucide-react'
import type { PanelRole } from '@/lib/auth'

export type NavItem = {
  to: '/' | '/instituciones' | '/calendario'
  label: string
  icon: LucideIcon
  roles: PanelRole[]
}

export const STAFF_ROLES: PanelRole[] = ['HNT', 'Admin', 'Profesor', 'Directiva', 'CEE']

export const navItems: NavItem[] = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, roles: STAFF_ROLES },
  // Las funciones admin* del backend solo aceptan HNT.
  { to: '/instituciones', label: 'Instituciones y miembros', icon: Building2, roles: ['HNT'] },
  // Profesor verifica (verifyCalendarEvent); Directiva, CEE, Admin y HNT editan el Calendar.
  { to: '/calendario', label: 'Calendario del curso', icon: CalendarCheck, roles: STAFF_ROLES },
]
