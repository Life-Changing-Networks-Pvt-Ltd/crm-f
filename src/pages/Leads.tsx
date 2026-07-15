import { useState, useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus, Users, ThumbsUp, ThumbsDown, Target, CalendarDays, Handshake, CheckCircle2, Loader2, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/services/api"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function Leads() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [apiStats, setApiStats] = useState({
    totalLeads: 0,
    interested: 0,
    notInterested: 0,
    prospective: 0,
    committed: 0,
    converted: 0,
    totalMeetings: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await api.get('/leads/stats')
      setApiStats(res.data.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch lead stats")
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { title: "Total Leads", value: apiStats.totalLeads, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Interested", value: apiStats.interested, icon: ThumbsUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Not Interested", value: apiStats.notInterested, icon: ThumbsDown, color: "text-red-500", bg: "bg-red-500/10" },
    { title: "Prospective", value: apiStats.prospective, icon: Target, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Committed", value: apiStats.committed, icon: Handshake, color: "text-orange-500", bg: "bg-orange-500/10" },
    { title: "Converted", value: apiStats.converted, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    { title: "Total Meetings", value: apiStats.totalMeetings, icon: CalendarDays, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Leads" description="Manage your sales leads.">
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Lead
        </Button>
      </PageHeader>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="shadow-sm border-muted/60 transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Create Selection Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">What kind of Lead?</DialogTitle>
            <DialogDescription className="text-center">
              Please choose whether you want to create a B2B Company lead or a B2C Customer lead.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div 
              onClick={() => navigate({ to: '/companies/new' })}
              className="flex flex-col items-center justify-center gap-4 p-8 border rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
            >
              <div className="p-4 bg-blue-100 rounded-full text-blue-600">
                <Building2 className="h-8 w-8" />
              </div>
              <span className="font-semibold text-lg text-foreground">Company</span>
            </div>

            <div 
              onClick={() => navigate({ to: '/customers/new' })}
              className="flex flex-col items-center justify-center gap-4 p-8 border rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
            >
              <div className="p-4 bg-emerald-100 rounded-full text-emerald-600">
                <Users className="h-8 w-8" />
              </div>
              <span className="font-semibold text-lg text-foreground">Customer</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
