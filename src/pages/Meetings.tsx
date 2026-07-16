import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import "react-big-calendar/lib/css/react-big-calendar.css"
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

import { enUS } from "date-fns/locale"

const locales = {
  "en-US": enUS
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export default function Meetings() {
  const { user: currentUser } = useSelector((state: RootState) => state.auth)
  
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
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

  useEffect(() => {
    fetchEvents()
    fetchParticipantsData()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const res = await api.get('/events')
      // Map to react-big-calendar format
      const formatted = res.data.data.map((e: any) => {
        const start = new Date(e.date)
        const end = new Date(e.date)
        end.setHours(end.getHours() + 1) // default 1 hour duration
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
      })
      setEvents(formatted)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load meetings")
    } finally {
      setLoading(false)
    }
  }

  const fetchParticipantsData = async () => {
    try {
      const [uRes, cRes, compRes] = await Promise.all([
        api.get('/users'),
        api.get('/customers'),
        api.get('/companies')
      ])
      setUsers(uRes.data.data)
      setCustomers(cRes.data.data)
      setCompanies(compRes.data.data)
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
      fetchEvents() // refresh
      
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
      fetchEvents();
      
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

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#3b82f6' // default blue
    if (event.status === 'Completed') {
      backgroundColor = '#10b981' // green for completed
    } else if (!event.isCreatedByMe) {
      backgroundColor = '#8b5cf6' // purple for assigned to me
    }
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block'
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Meetings & Calendar" description="Schedule and manage meetings with your team and clients." />
        
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
      </div>

      <div className="flex-1 min-h-[600px] border rounded-lg bg-card p-4 shadow-sm">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['month', 'week', 'day', 'agenda']}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={(event) => {
              setSelectedEvent(event)
              setIsEventModalOpen(true)
            }}
            tooltipAccessor={(e) => `${e.title}\nWith: ${e.participantName}`}
            components={{
              event: (props: any) => (
                <div className="text-xs p-0.5 truncate flex flex-col leading-tight">
                  <span className="font-semibold">{props.title}</span>
                  {props.event.participantName && props.event.participantName !== 'Unassigned' && (
                    <span className="opacity-80 text-[10px]">{props.event.participantName}</span>
                  )}
                </div>
              )
            }}
          />
        )}
      </div>
    </div>
  )
}
