import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-6 shrink-0 items-center rounded-full border px-2 text-xs font-medium leading-none",
  {
    variants: {
      variant: {
        default: "border-border-subtle bg-bg-card text-text-secondary",
        active: "border-brand-soft bg-brand-soft text-brand",
        success: "border-success-soft bg-success-soft text-success",
        warning: "border-warning-soft bg-warning-soft text-warning",
        danger: "border-danger-soft bg-danger-soft text-danger",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
