"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Clock, LogOut } from "lucide-react"

interface SessionTimeoutModalProps {
  open: boolean
  remainingTime: number
  onExtend: () => void
  onLogout: () => void
}

export function SessionTimeoutModal({
  open,
  remainingTime,
  onExtend,
  onLogout,
}: SessionTimeoutModalProps) {
  const seconds = Math.max(0, Math.ceil(remainingTime / 1000))
  const minutes = Math.floor(seconds / 60)
  const displaySeconds = seconds % 60

  const formatTime = () => {
    if (minutes > 0) {
      return `${minutes}:${displaySeconds.toString().padStart(2, "0")}`
    }
    return `${displaySeconds} seconds`
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
            <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <AlertDialogTitle className="text-center">
            Session Expiring Soon
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Your session will expire in{" "}
            <span className="font-semibold text-yellow-600 dark:text-yellow-400">
              {formatTime()}
            </span>{" "}
            due to inactivity. Would you like to stay logged in?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            onClick={onLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout Now
          </Button>
          <AlertDialogAction onClick={onExtend} className="flex items-center gap-2">
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
