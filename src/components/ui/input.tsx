import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

// Estilo de HanetField: relleno canvas, borde de 2px, texto 700 16/22.
// Va sobre `surface` (tarjetas, hojas). Para el label adentro usa <Field>.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "min-h-14 w-full min-w-0 rounded-hn-md border-2 border-hn-canvas bg-hn-canvas px-4 text-[16px] leading-[22px] font-bold tracking-[-0.4px] text-foreground caret-hn-accent transition-colors outline-none placeholder:font-bold placeholder:text-hn-field-placeholder focus-visible:border-hn-control-active disabled:pointer-events-none disabled:opacity-(--hn-opacity-disabled) aria-invalid:border-hn-accent",
        className
      )}
      {...props}
    />
  )
}

export { Input }
