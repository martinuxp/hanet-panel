import { Building2, CalendarCheck, GraduationCap, LayoutDashboard, type LucideIcon } from 'lucide-react'
import type { PanelRole } from '@/lib/auth'

export type NavItem = {
  to: '/' | '/instituciones' | '/halls' | '/calendario'
  label: string
  icon: LucideIcon
  roles: PanelRole[]
}

export const STAFF_ROLES: PanelRole[] = ['HNT', 'Admin', 'Profesor', 'Directiva', 'CEE']

/** Los que pueden hacer Halls (TEACHER_ROLES de functions/classhall.js). */
export const TEACHER_ROLES: PanelRole[] = ['Profesor', 'Admin', 'HNT']

export const navItems: NavItem[] = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, roles: STAFF_ROLES },
  // Las funciones admin* del backend solo aceptan HNT.
  { to: '/instituciones', label: 'Instituciones y miembros', icon: Building2, roles: ['HNT'] },
  { to: '/halls', label: 'Mis Halls', icon: GraduationCap, roles: TEACHER_ROLES },
  // Profesor verifica (verifyCalendarEvent); Directiva, CEE, Admin y HNT editan el Calendar.
  { to: '/calendario', label: 'Calendario del curso', icon: CalendarCheck, roles: STAFF_ROLES },
]
