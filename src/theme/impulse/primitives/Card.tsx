import { clx } from "@medusajs/ui"
import type { HTMLAttributes } from "react"

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: "sm" | "md" | "lg"
}

const paddingClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
}

export function Card({
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={clx(
        "rounded-xl bg-white border border-gray-100 shadow-sm",
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
