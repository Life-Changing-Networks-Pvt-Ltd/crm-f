import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { io } from "socket.io-client"
import { AlertTriangle, BellRing, CalendarClock, Check, Clock3, ExternalLink, Loader2 } from "lucide-react"
import type { RootState } from "@/store"
import api, { BACKEND_URL } from "@/services/api"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface FollowUpReminder {
  _id: string
  leadId: string
  companyName: string
  message: string
  type: string
  priority: string
  followUpDateTime: string
  reminderCount: number
}

const mergeReminder = (items: FollowUpReminder[], item: FollowUpReminder) => [
  item,
  ...items.filter((current) => current._id !== item._id),
]

const dueLabel = (dateTime: string) => {
  const minutes = Math.round((new Date(dateTime).getTime() - Date.now()) / 60_000)
  if (minutes < 0) return `Overdue by ${Math.abs(minutes)} min`
  if (minutes === 0) return "Due now"
  if (minutes < 60) return `Due in ${minutes} min`
  const hours = Math.ceil(minutes / 60)
  return `Due in ${hours} hour${hours === 1 ? "" : "s"}`
}

export function FollowUpReminderCenter() {
  const user = useSelector((state: RootState) => state.auth.user)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [reminders, setReminders] = useState<FollowUpReminder[]>([])
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [workingAction, setWorkingAction] = useState<"snooze" | "complete" | null>(null)
  const snoozedUntil = useRef(new Map<string, number>())

  const loadPending = useCallback(async () => {
    if (!user?._id) return
    try {
      const response = await api.get("/follow-ups/pending")
      const now = Date.now()
      setReminders((response.data.data || []).filter(
        (item: FollowUpReminder) => (snoozedUntil.current.get(item._id) || 0) <= now,
      ))
    } catch (error: any) {
      if (error.response?.status !== 401) console.error("Failed to recover follow-up reminders", error)
    }
  }, [user?._id])

  useEffect(() => {
    if (!user?._id) {
      setReminders([])
      return
    }
    void loadPending()
    const socketUrl = BACKEND_URL || window.location.origin
    const socket = io(socketUrl, { transports: ["websocket", "polling"] })
    const register = () => {
      socket.emit("register", user._id)
      void loadPending()
    }
    socket.on("connect", register)
    socket.on("follow_up_reminder", (reminder: FollowUpReminder) => {
      if ((snoozedUntil.current.get(reminder._id) || 0) > Date.now()) return
      snoozedUntil.current.delete(reminder._id)
      setReminders((current) => mergeReminder(current, reminder))
    })
    const recoverWhenVisible = () => {
      if (document.visibilityState === "visible") void loadPending()
    }
    document.addEventListener("visibilitychange", recoverWhenVisible)
    window.addEventListener("online", loadPending)
    window.addEventListener("follow-up-updated", loadPending)
    window.addEventListener("follow-up-reminders-refresh", loadPending)
    return () => {
      socket.disconnect()
      document.removeEventListener("visibilitychange", recoverWhenVisible)
      window.removeEventListener("online", loadPending)
      window.removeEventListener("follow-up-updated", loadPending)
      window.removeEventListener("follow-up-reminders-refresh", loadPending)
    }
  }, [loadPending, user?._id])

  const complete = async (id: string) => {
    try {
      setWorkingId(id)
      setWorkingAction("complete")
      await api.put(`/follow-ups/${id}/complete`)
      snoozedUntil.current.delete(id)
      setReminders((current) => current.filter((item) => item._id !== id))
      await queryClient.invalidateQueries({ queryKey: ["paged", "/companies/paged"] })
      window.dispatchEvent(new CustomEvent("follow-up-updated"))
      toast.success("Follow-up completed")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to complete follow-up")
    } finally {
      setWorkingId(null)
      setWorkingAction(null)
    }
  }

  const snooze = async (id: string) => {
    try {
      setWorkingId(id)
      setWorkingAction("snooze")
      const response = await api.put(`/follow-ups/${id}/snooze`, { minutes: 5 })
      const nextReminderAt = new Date(response.data.data?.nextReminderAt || Date.now() + 5 * 60_000).getTime()
      snoozedUntil.current.set(id, nextReminderAt)
      setReminders((current) => current.filter((item) => item._id !== id))
      toast.success("Reminder snoozed for 5 minutes")
      window.setTimeout(() => void loadPending(), Math.max(1_000, nextReminderAt - Date.now() + 1_000))
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to snooze reminder")
    } finally {
      setWorkingId(null)
      setWorkingAction(null)
    }
  }

  const openLead = (reminder: FollowUpReminder) => {
    setReminders((current) => current.filter((item) => item._id !== reminder._id))
    void navigate({
      to: "/leads/$id",
      params: { id: reminder.leadId },
    }).then(() => window.scrollTo({ top: 0, behavior: "smooth" }))
  }

  if (!user || reminders.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] bg-slate-950/15 backdrop-blur-[1px]" role="presentation">
      <aside
        className="pointer-events-auto absolute left-1/2 top-5 flex max-h-[calc(100vh-2.5rem)] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-3 overflow-y-auto"
        aria-label="Follow-up alerts"
        aria-live="assertive"
      >
        {reminders.map((reminder) => (
          <section
            key={reminder._id}
            className="overflow-hidden rounded-2xl border-2 border-amber-500/80 bg-background shadow-[0_24px_80px_-20px_rgba(194,65,12,0.65)]"
          >
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-5 py-2.5 text-white">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]">
                <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                  <span className="absolute inset-0 animate-ping rounded-full bg-white/25" />
                  <BellRing className="relative h-4 w-4" />
                </span>
                Follow-up alert
              </div>
              <span className="flex items-center gap-1 rounded-full bg-black/15 px-2.5 py-1 text-[10px] font-bold uppercase">
                <AlertTriangle className="h-3 w-3" />
                Action required
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold">{reminder.companyName}</p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{reminder.message}</p>
                </div>
                <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                  {reminder.priority}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                  <Clock3 className="h-3.5 w-3.5" /> {reminder.type}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {new Date(reminder.followUpDateTime).toLocaleString()}
                </span>
                <span className="rounded-full bg-red-100 px-3 py-1.5 font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                  {dueLabel(reminder.followUpDateTime)}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <Button variant="outline" disabled={workingId === reminder._id} onClick={() => openLead(reminder)}>
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Open Lead
                </Button>
                <Button
                  variant="outline"
                  className="border-amber-400 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:text-amber-300"
                  disabled={workingId === reminder._id}
                  onClick={() => snooze(reminder._id)}
                >
                  {workingId === reminder._id && workingAction === "snooze"
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><Clock3 className="mr-1.5 h-4 w-4" /> Snooze 5m</>}
                </Button>
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={workingId === reminder._id}
                  onClick={() => complete(reminder._id)}
                >
                  {workingId === reminder._id && workingAction === "complete"
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><Check className="mr-1.5 h-4 w-4" /> Done</>}
                </Button>
              </div>
            </div>
          </section>
        ))}
      </aside>
    </div>
  )
}
