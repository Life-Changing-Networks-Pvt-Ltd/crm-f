import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { ArrowLeft, Clock, Download, FileText, Loader2, PhoneIncoming, User } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/services/api"
import { toast } from "sonner"

const nameOf = (call: any) => call?.lead?.companyName || call?.lead?.name || call?.lead?.customerName || "Unknown lead"
const formatDuration = (seconds = 0) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`
const Detail = ({ label, value }: { label: string; value: unknown }) => <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 break-all text-sm">{String(value || "—")}</p></div>
const usableTranscript = (value: unknown) => {
  const transcript = String(value ?? "").trim()
  return Boolean(transcript) && !["null", "undefined", "[null]", "n/a"].includes(transcript.toLowerCase())
}

export default function CallDetails() {
  const { id } = useParams({ strict: false }) as { id: string }
  const navigate = useNavigate()
  const [call, setCall] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { try { const response = await api.get(`/telephony/calls/${id}`); setCall(response.data.data) } catch (error: any) { toast.error(error.response?.data?.message || "Call not found") } finally { setLoading(false) } }, [id])
  useEffect(() => { void load() }, [load])
  useEffect(() => {
    if (!call || !["pending", "processing"].includes(call.transcriptionStatus)) return undefined
    const timer = window.setInterval(() => { void load() }, 3_000)
    return () => window.clearInterval(timer)
  }, [call, load])
  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>
  if (!call) return null

  return <div className="flex flex-col gap-6 pb-8">
    <PageHeader title={nameOf(call)} description="Complete call record and conversation media."><Button variant="outline" onClick={() => navigate({ to: "/calls" })}><ArrowLeft className="mr-2 h-4 w-4" />Call history</Button></PageHeader>
    <div className="grid gap-4 md:grid-cols-4"><Card><CardContent className="flex items-center gap-3 p-5"><PhoneIncoming className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Status</p><Badge className="mt-1 capitalize" variant={call.status === "completed" ? "default" : call.status === "failed" ? "destructive" : "secondary"}>{call.status}</Badge></div></CardContent></Card><Card><CardContent className="flex items-center gap-3 p-5"><Clock className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Duration</p><p className="font-semibold">{formatDuration(call.durationSeconds)}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-3 p-5"><User className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Called by</p><p className="font-semibold">{call.calledBy?.name || "—"}</p></div></CardContent></Card><Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Started</p><p className="font-semibold">{new Date(call.callDatetime).toLocaleString()}</p></CardContent></Card></div>
    <div className="grid gap-6 lg:grid-cols-3"><div className="space-y-6 lg:col-span-2"><Card><CardHeader><CardTitle>Voice recording</CardTitle><CardDescription>Stereo recording of the connected browser and lead conversation.</CardDescription></CardHeader><CardContent>{call.recordingUrl ? <div className="space-y-3"><audio src={call.recordingUrl} controls className="w-full" /><Button variant="outline" asChild><a href={call.recordingUrl} download target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" />Download recording</a></Button></div> : <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">{call.recordingStatus === "failed" ? "Recording failed or was not generated." : "Recording is processing. Refresh after the provider callback arrives."}</div>}</CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Full transcript</CardTitle><CardDescription>Automatic Gemini transcription for Hindi, English, and Hinglish conversations.</CardDescription></CardHeader><CardContent>{usableTranscript(call.transcriptText) ? <div className="whitespace-pre-wrap rounded-lg bg-muted/40 p-5 text-sm leading-7">{call.transcriptText}</div> : <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">{call.transcriptionStatus === "failed" ? `Transcription failed: ${call.transcriptionError || "The recording could not be transcribed."}` : call.recordingStatus === "ready" ? "Gemini is generating the transcript. This page will update automatically." : "Transcript will be generated after the recording is ready."}</div>}</CardContent></Card></div><div className="space-y-6"><Card><CardHeader><CardTitle>Call information</CardTitle></CardHeader><CardContent className="grid gap-4"><Detail label="From virtual number" value={call.fromNumber} /><Detail label="Lead number" value={call.toNumber} /><Detail label="Lead type" value={call.leadModel} /><Detail label="Provider Call UUID" value={call.providerCallId} /><Detail label="Recording ID" value={call.recordingId} /><Detail label="Recording format" value={call.recordingFormat} /><Detail label="Hangup cause" value={call.hangupCause} /><Detail label="Hangup code" value={call.hangupCauseCode} /><Detail label="Created" value={new Date(call.createdAt).toLocaleString()} /><Detail label="Ended" value={call.endedAt ? new Date(call.endedAt).toLocaleString() : "—"} /></CardContent></Card>{call.manualComment && <Card><CardHeader><CardTitle>Agent notes</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm">{call.manualComment}</p></CardContent></Card>}</div></div>
  </div>
}
