import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[10px] border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand-soft active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger-soft dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-brand text-text-inverse shadow-[0_1px_2px_rgba(42,36,29,0.06)] hover:bg-brand-hover",
        outline:
          "border-border-subtle bg-bg-card text-text-primary hover:bg-brand-soft hover:text-text-primary aria-expanded:bg-brand-soft aria-expanded:text-text-primary dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "border-border-subtle bg-bg-card text-text-primary hover:bg-brand-soft aria-expanded:bg-brand-soft aria-expanded:text-text-primary",
        ghost:
          "text-text-secondary hover:bg-brand-soft hover:text-text-primary aria-expanded:bg-brand-soft aria-expanded:text-text-primary dark:hover:bg-muted/50",
        destructive:
          "bg-danger-soft text-danger hover:bg-danger-soft/80 focus-visible:border-danger focus-visible:ring-danger-soft dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "h-auto rounded-sm px-0 text-brand underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-1.5 px-[18px] has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1 rounded-[10px] px-3 text-[0.85rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 rounded-[10px] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-11",
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
