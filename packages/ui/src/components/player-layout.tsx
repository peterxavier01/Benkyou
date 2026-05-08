import * as React from "react"

import { cn } from "#lib/utils"

function PlayerWorkspace({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="player-workspace"
      className={cn(
        "grid min-h-[calc(100dvh-3.5rem)] gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]",
        className
      )}
      {...props}
    />
  )
}

function PlayerPrimary({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="player-primary"
      className={cn("flex min-w-0 flex-col gap-3", className)}
      {...props}
    />
  )
}

function PlayerVideoFrame({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="player-video-frame"
      className={cn(
        "aspect-video overflow-hidden rounded-lg border border-border bg-card",
        className
      )}
      {...props}
    />
  )
}

function PlayerAside({ className, ...props }: React.ComponentProps<"aside">) {
  return (
    <aside
      data-slot="player-aside"
      className={cn(
        "hidden min-h-0 rounded-lg border border-border bg-card lg:flex lg:flex-col",
        className
      )}
      {...props}
    />
  )
}

function PlayerTabletStack({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="player-tablet-stack"
      className={cn(
        "grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:hidden",
        className
      )}
      {...props}
    />
  )
}

function PlayerMobileDrawerSlot({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="player-mobile-drawer-slot"
      className={cn("md:hidden", className)}
      {...props}
    />
  )
}

export {
  PlayerAside,
  PlayerMobileDrawerSlot,
  PlayerPrimary,
  PlayerTabletStack,
  PlayerVideoFrame,
  PlayerWorkspace,
}
