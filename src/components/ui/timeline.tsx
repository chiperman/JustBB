import * as React from "react"
import { cn } from "@/lib/utils"

const Timeline = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("relative border-l border-border ml-2 pl-4 py-2", className)}
        {...props}
    />
))
Timeline.displayName = "Timeline"

const TimelineItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("relative pb-8 last:pb-0", className)} {...props} />
))
TimelineItem.displayName = "TimelineItem"

const TimelineDot = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-border ring-4 ring-background",
            className
        )}
        {...props}
    />
))
TimelineDot.displayName = "TimelineDot"

const TimelineHeading = React.forwardRef<
    HTMLHeadingElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h4
        ref={ref}
        className={cn(
            "text-base font-bold leading-none text-foreground/80 mb-3",
            className
        )}
        {...props}
    />
))
TimelineHeading.displayName = "TimelineHeading"

const TimelineContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-4", className)} {...props} />
))
TimelineContent.displayName = "TimelineContent"

export { Timeline, TimelineItem, TimelineDot, TimelineHeading, TimelineContent }
