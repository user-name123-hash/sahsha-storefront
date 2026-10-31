import { Button as MedusaButton } from "@medusajs/ui"
import { clx } from "@medusajs/ui"
import type { ComponentProps } from "react"

type ButtonVariant = "primary" | "secondary" | "ghost"

type ButtonProps = Omit<ComponentProps<typeof MedusaButton>, "variant"> & {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-accent hover:bg-brand-accent-hover text-white rounded-none font-semibold uppercase tracking-[var(--letter-spacing-nav)] text-xs",
  secondary:
    "bg-transparent border border-brand-accent text-brand-accent rounded-none font-semibold uppercase tracking-[var(--letter-spacing-nav)] text-xs hover:bg-brand-accent hover:text-white",
  ghost:
    "bg-transparent text-heading hover:opacity-70 rounded-none font-semibold uppercase tracking-[var(--letter-spacing-nav)] text-xs",
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <MedusaButton className={clx(variantClasses[variant], className)} {...props}>
      {children}
    </MedusaButton>
  )
}
