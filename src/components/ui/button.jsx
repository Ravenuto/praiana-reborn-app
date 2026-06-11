import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_12px_40px_-12px_hsl(var(--primary)/0.55)] hover:bg-[color:var(--brand-deep)] hover:-translate-y-0.5",
        gold:
          "bg-accent text-accent-foreground shadow-[0_12px_40px_-12px_hsl(var(--accent)/0.55)] hover:brightness-110 hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_12px_40px_-12px_hsl(var(--destructive)/0.5)] hover:bg-destructive/90 hover:-translate-y-0.5",
        outline:
          "border border-primary/30 bg-transparent text-primary hover:bg-primary/5 hover:border-primary/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-primary/5 hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-7 py-3",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-9 text-base",
        xs: "h-7 px-3 text-xs",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
