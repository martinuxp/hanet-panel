import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// HanetButton en web: pastilla de 50px, label DM Sans 700 16/24.
// En el panel `default` es el rosa (una vez por vista, para la acción
// principal), `secondary` el pizarra y `surface` la acción tranquila.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-transparent bg-clip-padding text-[16px] leading-6 font-bold whitespace-nowrap text-foreground transition-[opacity,transform,background-color] duration-150 outline-none select-none focus-visible:border-hn-control-active active:not-aria-[haspopup]:scale-[0.98] active:not-aria-[haspopup]:opacity-[0.86] disabled:pointer-events-none disabled:opacity-(--hn-opacity-disabled) aria-invalid:border-hn-accent motion-reduce:transition-none motion-reduce:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--primary),white_8%)]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_srgb,var(--secondary),white_8%)]",
        surface: "bg-hn-surface-muted hover:bg-[color-mix(in_srgb,var(--hn-surface-muted),white_8%)]",
        outline: "border-border bg-transparent hover:bg-muted",
        ghost: "hover:bg-muted aria-expanded:bg-muted",
        destructive: "bg-hn-surface-muted text-destructive hover:bg-[color-mix(in_srgb,var(--hn-surface-muted),white_8%)]",
        link: "rounded-none text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[50px] px-6 py-3",
        sm: "min-h-10 px-4 py-2",
        xs: "min-h-7 px-3 text-[14px] leading-5",
        lg: "min-h-[50px] px-8 py-3",
        icon: "size-11",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-[50px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
