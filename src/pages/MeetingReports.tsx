import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/layout/EmptyState"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import api from "@/services/api"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export default function MeetingReports() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const res = await api.get('/events?status=Completed')
      if (res.data?.success) {
        setReports(res.data.data)
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to fetch meeting reports")
    } finally {
      setLoading(false)
    }
  }

  const filteredReports = reports.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.participant?.name && r.participant.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.participant?.companyName && r.participant.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getParticipantName = (event: any) => {
    if (!event) return 'Unassigned';
    return event.participant?.name || event.participant?.companyName || 'Unassigned'
  }

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Meeting Reports" description="Review transcripts and summaries of completed meetings." />
        
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search reports..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 bg-card border rounded-lg overflow-hidden shadow-sm flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 p-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-10 w-10 text-muted-foreground" />}
            title="No reports found"
            description={searchTerm ? "Try adjusting your search query." : "There are no completed meetings with reports yet."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Meeting Title</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Participant</th>
                  <th className="px-6 py-4 font-medium">Duration</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredReports.map((report) => (
                  <tr key={report._id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{report.title}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(report.date).toLocaleDateString()} {new Date(report.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-6 py-4">{getParticipantName(report)}</td>
                    <td className="px-6 py-4">{report.report?.durationMinutes || 0} min</td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report)
                          setIsModalOpen(true)
                        }}
                      >
                        View Report
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meeting Report: {selectedReport?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4 grid gap-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-md">
              <div>
                <p className="text-muted-foreground mb-1 text-xs uppercase font-semibold">Date</p>
                <p>{selectedReport && new Date(selectedReport.date).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs uppercase font-semibold">Duration</p>
                <p>{selectedReport?.report?.durationMinutes} Minutes</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs uppercase font-semibold">Participant</p>
                <p>{getParticipantName(selectedReport)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs uppercase font-semibold">Attendees</p>
                <p>{selectedReport?.report?.attendees || 'N/A'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-primary">Summary / Key Action Items</h3>
              <div className="bg-muted/30 p-4 rounded-md whitespace-pre-wrap leading-relaxed">
                {selectedReport?.report?.summary || 'No summary provided.'}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-primary">Meeting Transcript</h3>
              <div className="bg-muted/30 p-4 rounded-md whitespace-pre-wrap leading-relaxed font-mono text-xs overflow-x-auto max-h-[300px] overflow-y-auto border">
                {selectedReport?.report?.transcript || 'No transcript available.'}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
