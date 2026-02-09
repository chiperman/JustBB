import * as React from "react"
import { cn } from "@/lib/utils"

const Timeline = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("relative ml-[11px] pl-6 py-2", className)}
        {...props}
    />
))
Timeline.displayName = "Timeline"

const TimelineItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("relative pb-6 last:pb-0 group/item", className)} {...props} />
))
TimelineItem.displayName = "TimelineItem"

const TimelineLine = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { active?: boolean }
>(({ className, active, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "absolute -left-[25px] top-0 h-full w-[2px] bg-border/30 transition-colors duration-300",
            active && "bg-primary",
            className
        )}
        {...props}
    />
))
TimelineLine.displayName = "TimelineLine"

const TimelineDot = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "absolute -left-[30px] top-2 h-3 w-3 rounded-full border-2 border-border bg-background ring-4 ring-transparent transition-all duration-300 z-10",
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
            "text-base font-bold font-mono leading-none text-foreground/90 mb-4",
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

export { Timeline, TimelineItem, TimelineLine, TimelineDot, TimelineHeading, TimelineContent }
