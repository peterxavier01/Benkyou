import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { Button } from "#components/button"
import { cn } from "#lib/utils"

const feedbackStateVariants = cva(
  "flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border p-6 text-center",
  {
    variants: {
      state: {
        empty: "border-dashed border-border bg-card text-card-foreground",
        loading: "border-border bg-muted/50 text-muted-foreground",
        error: "border-destructive/25 bg-destructive/5 text-destructive",
        disabled: "border-border bg-muted/40 text-muted-foreground opacity-80",
      },
    },
    defaultVariants: {
      state: "empty",
    },
  }
)

function FeedbackState({
  className,
  state = "empty",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof feedbackStateVariants>) {
  return (
    <div
      data-slot="feedback-state"
      data-state={state}
      className={cn(feedbackStateVariants({ state }), className)}
      {...props}
    />
  )
}

function FeedbackStateIcon({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="feedback-state-icon"
      className={cn(
        "flex size-9 items-center justify-center rounded-lg border border-border bg-background text-foreground [&_svg]:size-4",
        className
      )}
      {...props}
    />
  )
}

function FeedbackStateTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="feedback-state-title"
      className={cn("font-semibold text-base text-foreground", className)}
      {...props}
    />
  )
}

function FeedbackStateDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="feedback-state-description"
      className={cn("max-w-sm text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function FeedbackStateActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="feedback-state-actions"
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
      {...props}
    />
  )
}

function DisabledAction({
  reason,
  children,
  ...props
}: React.ComponentProps<typeof Button> & {
  reason?: string
}) {
  return (
    <Button aria-disabled="true" disabled title={reason} {...props}>
      {children}
    </Button>
  )
}

export {
  DisabledAction,
  FeedbackState,
  FeedbackStateActions,
  FeedbackStateDescription,
  FeedbackStateIcon,
  FeedbackStateTitle,
  feedbackStateVariants,
}
