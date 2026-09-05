import { useEffect, useState } from "react"
import { Loader2, Mic, MicOff, PhoneCall, PhoneOff, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { browserPhone, type PhoneState } from "@/services/browserPhone"
import { useNavigate } from "@tanstack/react-router"

export function BrowserCallDialog() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState<PhoneState>(browserPhone.getState())
  const [now, setNow] = useState(Date.now())
  useEffect(() => browserPhone.subscribe(setPhone), [])
  useEffect(() => {
    if (phone.status !== "in-call") return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [phone.status, phone.connectedAt])
  const active = ["incoming", "connecting", "ringing", "in-call"].includes(phone.status)
  const open = phone.status !== "idle"
  const elapsedSeconds = phone.connectedAt ? Math.max(0, Math.floor((now - phone.connectedAt) / 1000)) : 0
  const elapsed = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`

  return <Dialog open={open} onOpenChange={(next) => { if (!next && !active) browserPhone.dismiss() }}>
    <DialogContent className="max-w-sm">
      <DialogHeader className="items-center text-center">
        <div className={`mb-2 flex h-16 w-16 items-center justify-center rounded-full ${phone.status === "in-call" ? "bg-green-100 text-green-700" : phone.status === "error" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
          {phone.status === "connecting" || phone.status === "ringing" ? <Loader2 className="h-8 w-8 animate-spin" /> : phone.status === "error" ? <PhoneOff className="h-8 w-8" /> : <PhoneCall className={`h-8 w-8 ${phone.status === "incoming" ? "animate-pulse" : ""}`} />}
        </div>
        <DialogTitle>{phone.leadName || "Browser call"}</DialogTitle>
        <DialogDescription>{phone.message}</DialogDescription>
        {phone.status === "in-call" && <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">{elapsed}</div>}
      </DialogHeader>
      <div className="mt-4 flex justify-center gap-3">
        {phone.status === "incoming" && <><Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={() => browserPhone.rejectIncoming()} aria-label="Decline incoming call"><PhoneOff /></Button><Button size="icon" className="h-12 w-12 rounded-full bg-green-600 hover:bg-green-700" onClick={() => { void browserPhone.answerIncoming() }} aria-label="Answer incoming call"><PhoneCall /></Button></>}
        {phone.status === "in-call" && <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => browserPhone.toggleMute()}>{phone.muted ? <MicOff /> : <Mic />}</Button>}
        {active && phone.status !== "incoming" ? <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={() => browserPhone.hangup()}><PhoneOff /></Button> : !active ? <>{phone.callLogId && <Button variant="outline" onClick={() => { const callLogId = phone.callLogId; browserPhone.dismiss(); navigate({ to: `/calls/${callLogId}` }) }}>View details</Button>}<Button onClick={() => browserPhone.dismiss()}><X className="mr-2 h-4 w-4" />Close</Button></> : null}
      </div>
    </DialogContent>
  </Dialog>
}
