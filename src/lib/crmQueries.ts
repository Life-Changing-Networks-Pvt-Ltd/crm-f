import api from "@/services/api"

export interface CrmNotification {
  _id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  isRead: boolean
  createdAt: string
}

export interface CrmNote {
  _id: string
  title: string
  content: string
  color: string
  isSticky: boolean
  positionX: number
  positionY: number
}

export interface NotificationSummary {
  items: CrmNotification[]
  unreadCount: number
}

export const crmQueryKeys = {
  currentUser: ["auth", "me"] as const,
  settings: ["settings"] as const,
  notifications: ["notifications"] as const,
  notificationSummary: ["notifications", "summary"] as const,
  notes: ["notes"] as const,
  stickyNotes: ["notes", "sticky"] as const,
}

export const fetchCurrentUser = async () => {
  const response = await api.get("/auth/me")
  return response.data?.data
}

export const fetchSettings = async () => {
  const response = await api.get("/settings")
  return response.data?.data
}

export const fetchNotifications = async (): Promise<CrmNotification[]> => {
  const response = await api.get("/notifications")
  return response.data?.success ? response.data.data : []
}

export const fetchNotificationSummary = async (): Promise<NotificationSummary> => {
  const response = await api.get("/notifications/summary", { params: { limit: 5 } })
  return response.data?.success ? response.data.data : { items: [], unreadCount: 0 }
}

export const fetchNotes = async (): Promise<CrmNote[]> => {
  const response = await api.get("/notes")
  return response.data?.success ? response.data.data : []
}

export const fetchStickyNotes = async (): Promise<CrmNote[]> => {
  const response = await api.get("/notes/sticky")
  return response.data?.success ? response.data.data : []
}
