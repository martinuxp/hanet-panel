import { Link, type LinkProps } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

export function BackLink({ children, ...props }: LinkProps & { children: ReactNode }) {
  return (
    <Link
      {...props}
      className="inline-flex w-fit items-center gap-1.5 text-(length:--text-sm) text-(--text-secondary) transition-colors duration-(--duration-fast) hover:text-(--foreground)"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {children}
    </Link>
  )
}
