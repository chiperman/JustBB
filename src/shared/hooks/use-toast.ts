"use client"

import * as React from "react"
import { sileo } from "sileo"
import type { SileoOptions } from "sileo"

type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive" | "success"
  duration?: number
}

type Toast = Omit<ToasterToast, "id">

function toToastText(value: React.ReactNode) {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return undefined
}

function shouldExpandToastByDefault() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse), (max-width: 767px)").matches
  )
}

function toast({ title, description, variant, duration }: Toast) {
  const options: SileoOptions = {
    title: toToastText(title),
    description,
    duration,
  }

  if (variant === "destructive") {
    options.fill = "var(--toast-destructive-bg)"
    options.styles = {
      badge: "bg-(--toast-destructive-text)/15! text-(--toast-destructive-text)!",
      title: "text-(--toast-destructive-text)!",
      description: "text-(--toast-destructive-text)/80!",
    }
  } else if (variant === "success") {
    options.fill = "var(--toast-success-bg)"
    options.styles = {
      badge: "bg-(--toast-success-text)/15! text-(--toast-success-text)!",
      title: "text-(--toast-success-text)!",
      description: "text-(--toast-success-text)/80!",
    }
  }

  if (description && shouldExpandToastByDefault()) {
    options.autopilot = { expand: 0, collapse: 0 }
  }

  const id = variant === "destructive" ? sileo.error(options) : sileo.success(options)

  return {
    id,
    dismiss: () => sileo.dismiss(id),
    update: (props: ToasterToast) => {
      sileo.dismiss(id)
      return toast(props)
    },
  }
}

function useToast() {
  return {
    toasts: [],
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        sileo.dismiss(toastId)
      } else {
        sileo.clear()
      }
    },
  }
}

export { useToast, toast }
