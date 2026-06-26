"use client"

import * as React from "react"
import { sileo } from "sileo"

import type { ToastActionElement, ToastProps } from "@/shared/ui/toast"

const TOAST_LIMIT = 1

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

type Action =
  | {
      type: "ADD_TOAST"
      toast: ToasterToast
    }
  | {
      type: "UPDATE_TOAST"
      toast: Partial<ToasterToast>
    }
  | {
      type: "DISMISS_TOAST"
      toastId?: ToasterToast["id"]
    }
  | {
      type: "REMOVE_TOAST"
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

type Toast = Omit<ToasterToast, "id">

function toToastText(value: React.ReactNode) {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return undefined
}

function toast({ title, description, variant, duration }: Toast) {
  const options = {
    title: toToastText(title),
    description,
    duration,
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
