"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon as X } from "@hugeicons/core-free-icons"
import { cn } from "@/shared/lib/utils"
import { motion, useDragControls } from "framer-motion"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

function isSileoTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("[data-sileo-viewport], [data-sileo-toast]"))
  )
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
    onRequestClose?: () => void
  }
>(({ className, onRequestClose, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[95] bg-black/40 backdrop-blur-sm duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    onPointerDown={() => onRequestClose?.()}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    closeIcon?: React.ReactNode
    mobileDensity?: "default" | "compact" | "flush"
    onRequestClose?: () => void
  }
>(
  (
    {
      className,
      children,
      closeIcon,
      mobileDensity = "default",
      onInteractOutside,
      onPointerDownOutside,
      onRequestClose,
      ...props
    },
    ref
  ) => {
    const [isMobile, setIsMobile] = React.useState(false)
    const dragControls = useDragControls()
    const closeButtonRef = React.useRef<HTMLButtonElement>(null)

    React.useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 640)
      checkMobile()
      window.addEventListener("resize", checkMobile)
      return () => window.removeEventListener("resize", checkMobile)
    }, [])

    const requestClose = () => {
      if (onRequestClose) {
        onRequestClose()
        return
      }
      closeButtonRef.current?.click()
    }

    return (
      <DialogPortal>
        <DialogOverlay onRequestClose={onRequestClose} />
        <DialogPrimitive.Content
          ref={ref}
          asChild
          className={cn(
            "fixed inset-x-0 bottom-0 top-auto z-[96] grid max-h-[min(88dvh,calc(100dvh-16px))] w-full gap-6 overflow-y-auto overscroll-contain rounded-t-xl border border-border bg-background px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=closed]:ease-in data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full sm:left-[50%] sm:right-auto sm:top-[50%] sm:bottom-auto sm:max-h-[88vh] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:overflow-visible sm:rounded-xl sm:p-6 sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0",
            className,
            mobileDensity === "compact"
              ? "max-sm:!gap-3 max-sm:!rounded-b-none max-sm:!rounded-t-xl max-sm:!pb-[calc(0.875rem+env(safe-area-inset-bottom))] max-sm:!pt-7"
              : mobileDensity === "flush"
                ? "max-sm:!gap-0 max-sm:!rounded-b-none max-sm:!rounded-t-xl max-sm:!p-0"
                : "max-sm:!rounded-b-none max-sm:!rounded-t-xl max-sm:!pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-sm:!pt-9"
          )}
          onInteractOutside={(event) => {
            onInteractOutside?.(event)
            if (!event.defaultPrevented && isSileoTarget(event.target)) {
              event.preventDefault()
              return
            }

            if (!event.defaultPrevented) {
              requestClose()
            }
          }}
          onPointerDownOutside={(event) => {
            onPointerDownOutside?.(event)
            if (!event.defaultPrevented && isSileoTarget(event.target)) {
              event.preventDefault()
              return
            }

            if (!event.defaultPrevented) {
              requestClose()
            }
          }}
          {...props}
        >
          <motion.div
            drag={isMobile ? "y" : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.95 }}
            onDragEnd={(event, info) => {
              if (isMobile && (info.offset.y > 80 || info.velocity.y > 350)) {
                requestClose()
              }
            }}
          >
            {/* Mobile Drag Handle */}
            {isMobile && (
              <div
                className="absolute top-0 left-0 right-0 flex items-center justify-center py-3 select-none touch-none z-50 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
              </div>
            )}

            {children}

            <DialogPrimitive.Close
              ref={closeButtonRef}
              className="absolute right-4 top-4 h-8 w-8 flex items-center justify-center rounded-md text-foreground transition-all hover:bg-accent active:scale-95 disabled:pointer-events-none data-[state=open]:bg-secondary data-[state=open]:text-muted-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring max-sm:hidden"
            >
              {closeIcon || <HugeiconsIcon icon={X} size={16} />}
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPortal>
    )
  }
)
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight text-balance", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
