import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Clock, Loader2, PhoneCall } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import api from "@/services/api"
import { toast } from "sonner"

const leadName = (call: any) => call.lead?.companyName || call.lead?.name || call.lead?.customerName || "Unknown lead"
const duration = (seconds = 0) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`

export default function CallHistory() {
  const navigate = useNavigate()
  const [status, setStatus] = useState("all")
  const [fromNumber, setFromNumber] = useState("all")
  const [page, setPage] = useState(1)
  const callsQuery = useQuery<{ calls: any[]; pages: number; total: number; callingNumbers: string[] }>({
    queryKey: ["calls", page, status, fromNumber],
    queryFn: async () => (await api.get("/telephony/calls", { params: { page, status, fromNumber } })).data.data,
    staleTime: 2 * 60_000,
    gcTime: 30 * 60_000,
    placeholderData: keepPreviousData,
  })
  const calls = callsQuery.data?.calls || []
  const pages = callsQuery.data?.pages || 1
  const total = callsQuery.data?.total || 0
  const callingNumbers = callsQuery.data?.callingNumbers || []
  const loading = callsQuery.isLoading

  useEffect(() => {
    if (callsQuery.error) {
      const error = callsQuery.error as any
      toast.error(error.response?.data?.message || "Could not load call history")
    }
  }, [callsQuery.error])

  return <div className="flex flex-col gap-6 pb-8">
    <PageHeader title="Call History" description="Review browser calls, recordings, transcripts, outcomes, and provider details." />
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{total} total calls</p>
      <div className="flex flex-wrap gap-3">
        <Select value={fromNumber} onValueChange={(value) => { setFromNumber(value); setPage(1) }}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All calling numbers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All calling numbers</SelectItem>
            {callingNumbers.map((number) => <SelectItem key={number} value={number}>{number}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1) }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="in-progress">In progress</SelectItem>
            <SelectItem value="ringing">Ringing</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Lead</TableHead><TableHead>Agent</TableHead><TableHead>From Number</TableHead><TableHead>Date</TableHead><TableHead>Duration</TableHead><TableHead>Status</TableHead><TableHead>Media</TableHead><TableHead className="text-right">Details</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="h-32 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
              ) : calls.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">No calls found.</TableCell></TableRow>
              ) : calls.map((call) => (
                <TableRow key={call._id}>
                  <TableCell><p className="font-medium">{leadName(call)}</p><p className="text-xs text-muted-foreground">{call.toNumber || "—"}</p></TableCell>
                  <TableCell>{call.calledBy?.name || "—"}</TableCell>
                  <TableCell className="font-medium">{call.fromNumber || "—"}</TableCell>
                  <TableCell>{new Date(call.callDatetime).toLocaleString()}</TableCell>
                  <TableCell><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{duration(call.durationSeconds)}</span></TableCell>
                  <TableCell><Badge variant={call.status === "completed" ? "default" : call.status === "failed" ? "destructive" : "secondary"} className="capitalize">{call.status}</Badge></TableCell>
                  <TableCell><div className="flex gap-1"><Badge variant="outline">{call.recordingStatus === "ready" ? "Recording" : "No audio"}</Badge><Badge variant="outline">{call.transcriptionStatus === "completed" ? "Transcript" : call.transcriptionStatus === "failed" ? "Failed" : call.transcriptionStatus === "processing" ? "Processing" : "Pending"}</Badge></div></TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => navigate({ to: `/calls/${call._id}` })}><PhoneCall className="mr-2 h-4 w-4" />View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    {pages > 1 && <div className="flex items-center justify-center gap-3"><Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><span className="text-sm text-muted-foreground">Page {page} of {pages}</span><Button variant="outline" disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></div>}
  </div>
}
