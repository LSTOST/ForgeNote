import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        "flex h-11 w-full rounded-[var(--radius-md)] border border-border-strong bg-bg-card px-3.5 py-2.5 text-base leading-6 text-text-primary transition-colors outline-none placeholder:text-text-muted focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand-soft disabled:cursor-not-allowed disabled:bg-bg-panel disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger-soft md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
