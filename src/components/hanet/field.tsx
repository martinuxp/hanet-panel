import * as React from "react"
import { cn } from "cn"

type FieldProps = Omit<React.ComponentProps<"input">, "id"> & {
  id: string
  label: string
  invalid?: boolean
  error?: string | null
  leading?: React.ReactNode
  trailing?: React.ReactNode
}

// HanetField: input relleno con el label adentro (formularios de HaNet ID).
// Mínimo 56px, canvas, radio 16, foco control-active, inválido accent.
export function Field({ id, label, invalid, error, leading, trailing, className, ...props }: FieldProps) {
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className={cn(
          "flex min-h-14 cursor-text items-center gap-3 rounded-hn-md border-2 border-hn-canvas bg-hn-canvas px-4 py-2 transition-colors focus-within:border-hn-control-active",
          invalid && "border-hn-accent focus-within:border-hn-accent",
          className,
        )}
      >
        {leading}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[12px] leading-4 font-bold tracking-[-0.24px] text-hn-text-secondary/75">{label}</span>
          <input
            id={id}
            aria-invalid={invalid || undefined}
            aria-describedby={errorId}
            className="w-full min-w-0 bg-transparent text-[16px] leading-[22px] font-bold tracking-[-0.4px] text-foreground caret-hn-accent outline-none placeholder:text-hn-field-placeholder"
            {...props}
          />
        </span>
        {trailing}
      </label>
      {error && (
        <p id={errorId} className="px-1 text-[13px] leading-[18px] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
