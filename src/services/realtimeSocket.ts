import { io, type Socket } from "socket.io-client"
import { BACKEND_URL } from "@/services/api"

let sharedSocket: Socket | null = null
let referenceCount = 0
let registeredUserId: string | null = null

const registerCurrentUser = () => {
  if (sharedSocket?.connected && registeredUserId) {
    sharedSocket.emit("register", registeredUserId)
  }
}

export const acquireRealtimeSocket = (userId?: string | null) => {
  if (!sharedSocket) {
    sharedSocket = io(BACKEND_URL || window.location.origin, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    })
    sharedSocket.on("connect", registerCurrentUser)
  }

  referenceCount += 1
  if (userId) {
    registeredUserId = String(userId)
    registerCurrentUser()
  }
  if (!sharedSocket.connected) sharedSocket.connect()
  return sharedSocket
}

export const releaseRealtimeSocket = (socket: Socket) => {
  if (socket !== sharedSocket) return
  referenceCount = Math.max(0, referenceCount - 1)
  if (referenceCount > 0) return

  sharedSocket.off("connect", registerCurrentUser)
  sharedSocket.disconnect()
  sharedSocket = null
  registeredUserId = null
}
