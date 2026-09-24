import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import {
  BellRing,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react"
import type { RootState } from "@/store"
import api from "@/services/api"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { acquireRealtimeSocket, releaseRealtimeSocket } from "@/services/realtimeSocket"

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

const REMINDER_CARD_WIDTH = 360
const VIEWPORT_GAP = 12

const initialCardPosition = () => ({
  x: typeof window === "undefined"
    ? VIEWPORT_GAP
    : Math.max(VIEWPORT_GAP, window.innerWidth - REMINDER_CARD_WIDTH - VIEWPORT_GAP),
  y: VIEWPORT_GAP,
})

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

const compactDateLabel = (dateTime: string) => {
  const date = new Date(dateTime)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  if (isToday) return `Today, ${time}`
  return `${date.toLocaleDateString([], { day: "numeric", month: "short" })}, ${time}`
}

const compactDueLabel = (dateTime: string) => {
  const minutes = Math.round((new Date(dateTime).getTime() - Date.now()) / 60_000)
  if (minutes < 0) return `Overdue ${Math.abs(minutes)}m`
  if (minutes === 0) return "Due now"
  if (minutes < 60) return `Due in ${minutes}m`
  const hours = Math.ceil(minutes / 60)
  return `Due in ${hours}h`
}

export function FollowUpReminderCenter() {
  const user = useSelector((state: RootState) => state.auth.user)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [reminders, setReminders] = useState<FollowUpReminder[]>([])
  const [activeReminderId, setActiveReminderId] = useState<string | null>(null)
  const [isReminderListOpen, setIsReminderListOpen] = useState(false)
  const [drawerSide, setDrawerSide] = useState<"left" | "right">("right")
  const [cardPosition, setCardPosition] = useState(initialCardPosition)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [workingAction, setWorkingAction] = useState<"snooze" | "complete" | null>(null)
  const snoozedUntil = useRef(new Map<string, number>())
  const hasConnected = useRef(false)
  const reminderCardRef = useRef<HTMLElement | null>(null)
  const dragState = useRef<{
    pointerId: number
    pointerX: number
    pointerY: number
    cardX: number
    cardY: number
  } | null>(null)

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
    const socket = acquireRealtimeSocket(user._id)
    hasConnected.current = socket.connected
    const register = () => {
      if (hasConnected.current) void loadPending()
      hasConnected.current = true
    }
    const receiveReminder = (reminder: FollowUpReminder) => {
      if ((snoozedUntil.current.get(reminder._id) || 0) > Date.now()) return
      snoozedUntil.current.delete(reminder._id)
      setReminders((current) => mergeReminder(current, reminder))
      setActiveReminderId(reminder._id)
    }
    socket.on("connect", register)
    socket.on("follow_up_reminder", receiveReminder)
    const removeCancelled = ({ _id }: { _id: string }) => {
      snoozedUntil.current.delete(_id)
      setReminders((current) => current.filter((item) => item._id !== _id))
    }
    socket.on("follow_up_cancelled", removeCancelled)
    const recoverWhenVisible = () => {
      if (document.visibilityState === "visible") void loadPending()
    }
    document.addEventListener("visibilitychange", recoverWhenVisible)
    window.addEventListener("online", loadPending)
    window.addEventListener("follow-up-updated", loadPending)
    window.addEventListener("follow-up-reminders-refresh", loadPending)
    return () => {
      hasConnected.current = false
      socket.off("connect", register)
      socket.off("follow_up_reminder", receiveReminder)
      socket.off("follow_up_cancelled", removeCancelled)
      releaseRealtimeSocket(socket)
      document.removeEventListener("visibilitychange", recoverWhenVisible)
      window.removeEventListener("online", loadPending)
      window.removeEventListener("follow-up-updated", loadPending)
      window.removeEventListener("follow-up-reminders-refresh", loadPending)
    }
  }, [loadPending, user?._id])

  useEffect(() => {
    if (reminders.length === 0) {
      setActiveReminderId(null)
      setIsReminderListOpen(false)
      return
    }
    setActiveReminderId((current) => (
      current && reminders.some((reminder) => reminder._id === current)
        ? current
        : reminders[0]._id
    ))
  }, [reminders])

  const keepCardInViewport = useCallback((x: number, y: number) => {
    const card = reminderCardRef.current
    const width = card?.offsetWidth || Math.min(REMINDER_CARD_WIDTH, window.innerWidth - VIEWPORT_GAP * 2)
    const height = card?.offsetHeight || 0
    return {
      x: Math.min(Math.max(VIEWPORT_GAP, x), Math.max(VIEWPORT_GAP, window.innerWidth - width - VIEWPORT_GAP)),
      y: Math.min(Math.max(VIEWPORT_GAP, y), Math.max(VIEWPORT_GAP, window.innerHeight - height - VIEWPORT_GAP)),
    }
  }, [])

  useEffect(() => {
    const handleResize = () => setCardPosition((current) => keepCardInViewport(current.x, current.y))
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [keepCardInViewport])

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

  const activeReminderIndex = Math.max(
    0,
    reminders.findIndex((reminder) => reminder._id === activeReminderId),
  )
  const activeReminder = reminders[activeReminderIndex]

  const showPreviousReminder = () => {
    const nextIndex = (activeReminderIndex - 1 + reminders.length) % reminders.length
    setActiveReminderId(reminders[nextIndex]._id)
  }

  const showNextReminder = () => {
    const nextIndex = (activeReminderIndex + 1) % reminders.length
    setActiveReminderId(reminders[nextIndex]._id)
  }

  const startDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    dragState.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      cardX: cardPosition.x,
      cardY: cardPosition.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  const dragCard = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragState.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setCardPosition(keepCardInViewport(
      drag.cardX + event.clientX - drag.pointerX,
      drag.cardY + event.clientY - drag.pointerY,
    ))
  }

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragState.current?.pointerId !== event.pointerId) return
    dragState.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const openReminderList = () => {
    const card = reminderCardRef.current
    const cardCenter = card
      ? card.getBoundingClientRect().left + card.offsetWidth / 2
      : cardPosition.x + REMINDER_CARD_WIDTH / 2
    setDrawerSide(cardCenter <= window.innerWidth / 2 ? "left" : "right")
    setIsReminderListOpen(true)
  }

  const reminderActions = (reminder: FollowUpReminder, compact = false) => (
    <div className="grid grid-cols-3 gap-2">
      <Button
        size="sm"
        variant="outline"
        className={compact ? "h-8 px-2 text-xs" : undefined}
        disabled={workingId === reminder._id}
        onClick={() => openLead(reminder)}
      >
        <ExternalLink className={compact ? "mr-1 h-3 w-3" : "mr-1.5 h-3.5 w-3.5"} /> Open Lead
      </Button>
      <Button
        size="sm"
        variant="outline"
        className={`border-amber-400 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:text-amber-300 ${compact ? "h-8 px-2 text-xs" : ""}`}
        disabled={workingId === reminder._id}
        onClick={() => snooze(reminder._id)}
      >
        {workingId === reminder._id && workingAction === "snooze"
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <><Clock3 className={compact ? "mr-1 h-3 w-3" : "mr-1.5 h-3.5 w-3.5"} /> Snooze 5m</>}
      </Button>
      <Button
        size="sm"
        className={`bg-emerald-600 text-white hover:bg-emerald-700 ${compact ? "h-8 px-2 text-xs" : ""}`}
        disabled={workingId === reminder._id}
        onClick={() => complete(reminder._id)}
      >
        {workingId === reminder._id && workingAction === "complete"
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <><Check className={compact ? "mr-1 h-3 w-3" : "mr-1.5 h-3.5 w-3.5"} /> Done</>}
      </Button>
    </div>
  )

  return (
    <>
      {!isReminderListOpen && (
        <aside
          ref={reminderCardRef}
          className="fixed z-[90] w-[min(360px,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-amber-500/80 bg-background shadow-[0_18px_55px_-18px_rgba(194,65,12,0.65)]"
          style={{ left: cardPosition.x, top: cardPosition.y }}
          aria-label="Follow-up alert"
          aria-live="assertive"
        >
          <div
            className="flex touch-none cursor-grab select-none items-center justify-between gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-3 py-1.5 text-white active:cursor-grabbing"
            onPointerDown={startDragging}
            onPointerMove={dragCard}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            title="Drag to move reminder"
          >
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em]">
              <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                <span className="absolute inset-0 animate-ping rounded-full bg-white/25" />
                <BellRing className="relative h-3 w-3" />
              </span>
              Follow-up alert
            </div>
            <span className="rounded-full bg-black/15 px-2 py-0.5 text-[9px] font-bold uppercase">
              {reminders.length === 1 ? "Action required" : `${reminders.length} pending`}
            </span>
          </div>

          <div className="p-3">
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{activeReminder.companyName}</p>
                <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap break-words text-[13px] leading-5 text-muted-foreground">
                  {activeReminder.message}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                {activeReminder.priority}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-1 text-[10px]">
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                <Clock3 className="h-3 w-3" /> {activeReminder.type}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                <CalendarClock className="h-3 w-3" />
                {compactDateLabel(activeReminder.followUpDateTime)}
              </span>
              <span className="rounded-full bg-red-100 px-2 py-1 font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {compactDueLabel(activeReminder.followUpDateTime)}
              </span>
            </div>

            <div className="mt-3">{reminderActions(activeReminder, true)}</div>

            {reminders.length > 1 && (
              <div className="mt-2.5 flex items-center justify-between border-t pt-2.5">
                <div className="flex items-center gap-0.5">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={showPreviousReminder} aria-label="Previous reminder">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="min-w-10 text-center text-[11px] font-medium text-muted-foreground">
                    {activeReminderIndex + 1} of {reminders.length}
                  </span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={showNextReminder} aria-label="Next reminder">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={openReminderList}>
                  View all ({reminders.length})
                </Button>
              </div>
            )}
          </div>
        </aside>
      )}

      {isReminderListOpen && (
        <aside
          className={`fixed inset-y-0 z-[95] flex w-[min(440px,100vw)] flex-col bg-background shadow-2xl ${
            drawerSide === "left" ? "left-0 border-r" : "right-0 border-l"
          }`}
          aria-label="Pending follow-up reminders"
          aria-live="polite"
        >
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-orange-600" />
                <h2 className="font-semibold">Follow-up reminders</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {reminders.length} pending reminder{reminders.length === 1 ? "" : "s"}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsReminderListOpen(false)}
              aria-label="Close reminders"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {reminders.map((reminder) => (
              <section key={reminder._id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{reminder.companyName}</p>
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                      {reminder.message}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                    {reminder.priority}
                  </span>
                </div>
                <div className="my-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                    <Clock3 className="h-3 w-3" /> {reminder.type}
                  </span>
                  <span className="rounded-full bg-red-100 px-2.5 py-1 font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                    {dueLabel(reminder.followUpDateTime)}
                  </span>
                </div>
                {reminderActions(reminder)}
              </section>
            ))}
          </div>
        </aside>
      )}
    </>
  )
}
