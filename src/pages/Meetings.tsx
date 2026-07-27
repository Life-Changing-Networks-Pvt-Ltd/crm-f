import { useMemo, useState, useEffect } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataPagination } from "@/components/shared/DataPagination"
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery"

export default function Meetings() {
  const { user: currentUser } = useSelector((state: RootState) => state.auth)
  
  const [page, setPage] = useState(1)
  const [dateFilter, setDateFilter] = useState("All")
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [durationMinutes, setDurationMinutes] = useState("")
  const [attendees, setAttendees] = useState("")
  const [transcript, setTranscript] = useState("")
  const [summary, setSummary] = useState("")
  
  // Form State
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [type, setType] = useState("Meeting")
  const [meetingLink, setMeetingLink] = useState("")
  const [participantModel, setParticipantModel] = useState("User")
  const [participant, setParticipant] = useState("")
  
  // Data for selects
  const [users, setUsers] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [participantsLoaded, setParticipantsLoaded] = useState(false)

  const dateRange = useMemo(() => {
    if (dateFilter === "All") return {}
    const today = new Date()
    let start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    let end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
    if (dateFilter === "This Week") {
      start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
      end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else if (dateFilter === "This Month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1)
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
    }
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }, [dateFilter])
  const { data, isLoading: loading, refetch: fetchEvents } = usePaginatedQuery<any>({
    endpoint: "/events/paged",
    page,
    limit: 25,
    params: dateRange,
  })
  const events = useMemo(() => (data?.items || []).map((e: any) => {
        const start = new Date(e.date)
        const end = new Date(e.date)
        end.setHours(end.getHours() + 1)
        return {
          id: e._id,
          title: e.title,
          start,
          end,
          participantName: e.participant?.name || e.participant?.companyName || 'Unassigned',
          type: e.type,
          meetingLink: e.meetingLink,
          status: e.status,
          isCreatedByMe: e.createdBy?._id === currentUser?._id
        }
      }), [data?.items, currentUser?._id])

  useEffect(() => {
    if (isModalOpen && !participantsLoaded) void fetchParticipantsData()
  }, [isModalOpen, participantsLoaded])

  const fetchParticipantsData = async () => {
    try {
      const [uRes, cRes, compRes] = await Promise.all([
        api.get('/users/options', { params: { purpose: 'meeting' } }),
        api.get('/customers/options'),
        api.get('/companies/options')
      ])
      setUsers(uRes.data.data)
      setCustomers(cRes.data.data)
      setCompanies(compRes.data.data)
      setParticipantsLoaded(true)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreate = async () => {
    if (!title || !date || !time) {
      toast.error("Please fill required fields")
      return
    }

    try {
      setSaving(true)
      // combine date and time
      const dateTime = new Date(`${date}T${time}`)

      const payload: any = {
        title,
        date: dateTime.toISOString(),
        type,
        meetingLink
      }

      if (participant) {
        payload.participant = participant
        payload.participantModel = participantModel
      }

      await api.post('/events', payload)
      toast.success("Meeting scheduled successfully")
      setIsModalOpen(false)
      await fetchEvents()
      
      // reset form
      setTitle("")
      setDate("")
      setTime("")
      setMeetingLink("")
      setParticipant("")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create meeting")
    } finally {
      setSaving(false)
    }
  }

  const handleCompleteMeeting = async () => {
    if (!durationMinutes || !attendees || !transcript || !summary) {
      toast.error("Please fill all fields for the report");
      return;
    }
    
    try {
      setSaving(true);
      await api.post(`/events/${selectedEvent.id}/report`, {
        durationMinutes: parseInt(durationMinutes),
        attendees,
        transcript,
        summary
      });
      toast.success("Meeting marked as completed and report saved");
      setIsReportModalOpen(false);
      setIsEventModalOpen(false);
      await fetchEvents();
      
      // reset
      setDurationMinutes("");
      setAttendees("");
      setTranscript("");
      setSummary("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit report");
    } finally {
      setSaving(false);
    }
  }

  const renderParticipantOptions = () => {
    if (participantModel === 'User') {
      return users
        .filter(u => u._id !== currentUser?._id)
        .map(u => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)
    }
    if (participantModel === 'Customer') {
      return customers.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)
    }
    if (participantModel === 'Company') {
      return companies.map(c => <SelectItem key={c._id} value={c._id}>{c.companyName}</SelectItem>)
    }
    return null
  }

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <PageHeader title="Meetings" description="Schedule and manage meetings with your team and clients.">
        <Select value={dateFilter} onValueChange={(value) => {
          setDateFilter(value)
          setPage(1)
        }}>
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="Date Added" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Time</SelectItem>
            <SelectItem value="Today">Today</SelectItem>
            <SelectItem value="This Week">This Week</SelectItem>
            <SelectItem value="This Month">This Month</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <Plus className="h-4 w-4" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Schedule a Meeting</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Meeting Title *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Client Follow-up" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Event Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                    <SelectItem value="Call">Call</SelectItem>
                    <SelectItem value="Task">Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 border-t pt-4 mt-2">
                <Label htmlFor="meetingLink">Meeting Link (Optional)</Label>
                <Input id="meetingLink" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="e.g., https://meet.google.com/..." />
              </div>

              <div className="grid gap-2 border-t pt-4 mt-2">
                <Label className="text-muted-foreground font-semibold">Assign/Invite Participant (Optional)</Label>
                
                <div className="grid grid-cols-[120px_1fr] gap-2 mt-2">
                  <Select 
                    value={participantModel} 
                    onValueChange={(val) => {
                      setParticipantModel(val)
                      setParticipant("") // reset participant when model changes
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="Customer">Customer</SelectItem>
                      <SelectItem value="Company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={participant} onValueChange={setParticipant}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${participantModel}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {renderParticipantOptions()}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Schedule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedEvent?.title}</DialogTitle>
            </DialogHeader>
            <div className="py-4 grid gap-2 text-sm">
              <p><strong>Date & Time:</strong> {selectedEvent?.start?.toLocaleString()}</p>
              <p><strong>Type:</strong> {selectedEvent?.type}</p>
              <p><strong>Status:</strong> {selectedEvent?.status}</p>
              <p><strong>Participant:</strong> {selectedEvent?.participantName}</p>
              {selectedEvent?.meetingLink && (
                <p>
                  <strong>Link:</strong> <a href={selectedEvent.meetingLink} target="_blank" rel="noreferrer" className="text-primary hover:underline">{selectedEvent.meetingLink}</a>
                </p>
              )}
            </div>
            <DialogFooter>
              {selectedEvent?.meetingLink && (
                <Button onClick={() => window.open(selectedEvent.meetingLink, '_blank')}>
                  Join Meeting
                </Button>
              )}
              {selectedEvent?.status !== 'Completed' && (
                <Button variant="secondary" onClick={() => { setIsEventModalOpen(false); setIsReportModalOpen(true); }}>
                  Submit Report
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsEventModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Meeting Report</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (Minutes)</Label>
                  <Input id="duration" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="e.g. 45" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="attendees">Attendees</Label>
                  <Input id="attendees" value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="e.g. Alice, Bob" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="transcript">Transcript / Notes</Label>
                <textarea 
                  id="transcript" 
                  value={transcript} 
                  onChange={(e) => setTranscript(e.target.value)} 
                  placeholder="Paste the full meeting transcript or detailed notes here..."
                  className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="summary">AI Summary / Key Action Items</Label>
                <textarea 
                  id="summary" 
                  value={summary} 
                  onChange={(e) => setSummary(e.target.value)} 
                  placeholder="Provide a brief summary and next steps..."
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCompleteMeeting} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete Meeting"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex-1 border rounded-lg bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No meetings found.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                    setSelectedEvent(event)
                    setIsEventModalOpen(true)
                  }}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.type}</TableCell>
                    <TableCell>{event.start.toLocaleString()}</TableCell>
                    <TableCell>{event.participantName}</TableCell>
                    <TableCell>
                      <Badge variant={event.status === 'Completed' ? 'default' : 'secondary'}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation()
                        setSelectedEvent(event)
                        setIsEventModalOpen(true)
                      }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        {data?.pagination && (
          <DataPagination pagination={data.pagination} onPageChange={setPage} />
        )}
      </div>
    </div>
  )
}
