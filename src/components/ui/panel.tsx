import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const panelVariants = cva("bg-bg-panel text-text-primary", {
  variants: {
    variant: {
      default: "border border-border-subtle p-4",
      left: "border-r border-border-subtle p-4",
      right: "border-l border-border-subtle p-4",
      bottom: "border-t border-border-subtle px-5 py-3",
      elevated:
        "border border-border-subtle bg-bg-elevated p-4 shadow-[var(--shadow-popover)]",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Panel({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof panelVariants>) {
  return (
    <div
      data-slot="panel"
      className={cn(panelVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Panel, panelVariants }
