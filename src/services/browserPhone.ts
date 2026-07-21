import Plivo from "plivo-browser-sdk"
import api from "@/services/api"

export type PhoneStatus = "idle" | "connecting" | "ringing" | "in-call" | "ended" | "error"
export type PhoneState = { status: PhoneStatus; leadName: string; muted: boolean; message?: string; callLogId?: string; connectedAt?: number }

let sdk: Plivo | null = null
let loggedInUser = ""
let state: PhoneState = { status: "idle", leadName: "", muted: false }
const listeners = new Set<(value: PhoneState) => void>()
let loginResolve: (() => void) | null = null
let loginReject: ((error: Error) => void) | null = null
let callConnected = false
let connectedAt = 0
let statusPollTimer: number | undefined
let suppressNextTermination = false

const stopStatusPolling = () => {
  if (statusPollTimer !== undefined) window.clearInterval(statusPollTimer)
  statusPollTimer = undefined
}

const terminalMessage = (call: { status?: string; hangupCause?: string }) => {
  const cause = String(call.hangupCause || "").toLowerCase()
  if (cause.includes("busy") || cause.includes("reject")) return "Lead rejected the call or the line was busy"
  if (cause.includes("no answer") || cause.includes("timeout")) return "Lead did not answer the call"
  return "Call ended before connection"
}

const startStatusPolling = (callLogId: string) => {
  stopStatusPolling()
  let polling = false
  statusPollTimer = window.setInterval(async () => {
    if (polling || state.callLogId !== callLogId) return
    polling = true
    try {
      const response = await api.get(`/telephony/calls/${callLogId}`)
      const call = response.data?.data?.call || response.data?.data
      if (!call) return
      if (call.status === "in-progress" && state.status !== "in-call") {
        callConnected = true
        connectedAt ||= Date.now()
        publish({ status: "in-call", message: "Call connected", connectedAt })
      } else if (call.status === "ringing" && state.status === "connecting") {
        publish({ status: "ringing", message: "Lead phone is ringing…" })
      } else if (["completed", "failed", "cancelled"].includes(call.status)) {
        stopStatusPolling()
        const completed = call.status === "completed"
        suppressNextTermination = true
        sdk?.client.hangup()
        window.setTimeout(() => { suppressNextTermination = false }, 2000)
        publish({
          status: completed ? "ended" : "error",
          message: completed ? "Call ended" : terminalMessage(call),
          muted: false,
        })
        callConnected = false
        connectedAt = 0
      }
    } catch {
      // A transient status request must not interrupt the active call.
    } finally {
      polling = false
    }
  }, 750)
}

const finalizeCall = (connected: boolean, reason: string) => {
  if (!state.callLogId) return
  const durationSeconds = connectedAt ? Math.max(0, Math.round((Date.now() - connectedAt) / 1000)) : 0
  void api.post(`/telephony/calls/${state.callLogId}/finalize`, { connected, reason, durationSeconds }).catch(() => undefined)
}

const publish = (patch: Partial<PhoneState>) => {
  // Plivo can emit failed/terminated events after the user has already closed
  // a terminal dialog. Do not let those stale events reopen it.
  if (state.status === "idle" && patch.status && patch.status !== "connecting") return
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener(state))
}

const ensureSdk = () => {
  if (sdk) return sdk
  sdk = new Plivo({ debug: "ERROR", permOnClick: true, enableTracking: true, closeProtection: true, clientRegion: "south_asia" })
  const client = sdk.client
  const events = client as unknown as { on: (event: string, callback: (...args: unknown[]) => void) => void }
  events.on("onLogin", () => { loginResolve?.(); loginResolve = null; loginReject = null })
  events.on("onLoginFailed", (cause: unknown) => { loginReject?.(new Error(String(cause || "Plivo endpoint login failed"))); loginResolve = null; loginReject = null })
  events.on("onCalling", () => publish({ status: "connecting", message: "Connecting through Plivo…" }))
  events.on("onCallRemoteRinging", () => publish({ status: "ringing", message: "Lead phone is ringing…" }))
  events.on("onCallConnected", () => publish({ status: "ringing", message: "Lead phone is ringing…" }))
  events.on("onCallAnswered", () => { callConnected = true; connectedAt ||= Date.now(); publish({ status: "in-call", message: "Call connected", connectedAt }) })
  events.on("onMediaConnected", () => { callConnected = true; connectedAt ||= Date.now(); publish({ status: "in-call", message: "Call connected", connectedAt }) })
  events.on("onCallFailed", (info: unknown) => {
    stopStatusPolling()
    if (suppressNextTermination) return
    const detail = info && typeof info === "object" ? JSON.stringify(info) : String(info || "")
    const message = detail.toLowerCase().includes("busy")
      ? "Lead rejected the call or the line was busy"
      : "Call could not be completed"
    finalizeCall(false, detail || "Call failed")
    publish({ status: "error", message })
  })
  events.on("onCallTerminated", () => {
    stopStatusPolling()
    if (suppressNextTermination) { suppressNextTermination = false; return }
    finalizeCall(callConnected, callConnected ? "Normal Hangup" : "Call ended before connection")
    publish({ status: callConnected ? "ended" : "error", message: callConnected ? "Call ended" : "Call was not connected", muted: false })
    callConnected = false; connectedAt = 0; suppressNextTermination = false
  })
  events.on("onMediaPermission", (permission: unknown) => {
    if (String(permission).toLowerCase().includes("denied")) publish({ status: "error", message: "Microphone permission was denied" })
  })
  return sdk
}

const login = async (username: string, password: string) => {
  const instance = ensureSdk()
  if (loggedInUser === username && instance.client.isLoggedIn) return
  if (loggedInUser && loggedInUser !== username) instance.client.logout()
  await new Promise<void>((resolve, reject) => {
    loginResolve = resolve
    loginReject = reject
    instance.client.login(username, password)
    window.setTimeout(() => {
      if (loginReject) {
        loginReject(new Error("Plivo endpoint login timed out"))
        loginResolve = null
        loginReject = null
      }
    }, 15000)
  })
  loggedInUser = username
}

export const browserPhone = {
  subscribe(listener: (value: PhoneState) => void) {
    listeners.add(listener)
    listener(state)
    return () => { listeners.delete(listener) }
  },
  getState: () => state,
  async start(type: string, id: string, leadName: string) {
    if (!["idle", "ended", "error"].includes(state.status)) throw new Error("Another call is already active")
    publish({ status: "connecting", leadName, muted: false, message: "Requesting microphone access…" })
    callConnected = false; connectedAt = 0; suppressNextTermination = false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      const response = await api.post(`/leads/unified/${type}/${id}/call`, { mode: "browser" })
      const callLogId = response.data.data.callLog?._id
      publish({ callLogId })
      if (callLogId) startStatusPolling(callLogId)
      const { username, password, dialCode } = response.data.data.providerResponse
      await login(username, password)
      const placed = ensureSdk().client.call(dialCode, { "X-PH-CRM": "browser" })
      if (!placed) throw new Error("Plivo could not start the browser call")
    } catch (error) {
      stopStatusPolling()
      const message = error instanceof Error ? error.message : typeof error === "object" ? JSON.stringify(error) : "Browser call failed"
      publish({ status: "error", message })
      throw error
    }
  },
  hangup() { sdk?.client.hangup() },
  toggleMute() {
    if (!sdk) return
    if (state.muted) sdk.client.unmute(); else sdk.client.mute()
    publish({ muted: !state.muted })
  },
  dismiss() { if (["ended", "error"].includes(state.status)) { stopStatusPolling(); publish({ status: "idle", leadName: "", message: undefined, muted: false, callLogId: undefined, connectedAt: undefined }) } },
}
