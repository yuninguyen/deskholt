import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex h-8 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90",
        destructive: "bg-admin-destructive text-admin-primary-foreground hover:bg-admin-destructive/90",
        outline: "border border-admin-input bg-transparent hover:bg-admin-accent hover:text-admin-accent-foreground",
        secondary: "bg-admin-secondary text-admin-secondary-foreground hover:bg-admin-secondary/80",
        ghost: "hover:bg-admin-accent hover:text-admin-accent-foreground",
        link: "text-admin-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-3 py-2",
        sm: "h-7 rounded-md px-2 text-xs",
        lg: "h-9 rounded-md px-4",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"

  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
