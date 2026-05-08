import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { Badge } from "#components/badge"
import { cn } from "#lib/utils"

const statusBadgeVariants = cva(
  "border font-medium",
  {
    variants: {
      tone: {
        neutral:
          "border-border bg-muted text-muted-foreground",
        info:
          "border-secondary/70 bg-secondary text-secondary-foreground",
        success:
          "border-primary/25 bg-primary/10 text-primary",
        warning:
          "border-[oklch(0.78_0.1_95)] bg-[oklch(0.95_0.037_95)] text-[oklch(0.42_0.08_95)]",
        danger:
          "border-destructive/25 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

function StatusBadge({
  className,
  tone = "neutral",
  ...props
}: React.ComponentProps<typeof Badge> &
  VariantProps<typeof statusBadgeVariants>) {
  return (
    <Badge
      data-slot="status-badge"
      variant="outline"
      className={cn(statusBadgeVariants({ tone }), className)}
      {...props}
    />
  )
}

export { StatusBadge, statusBadgeVariants }
