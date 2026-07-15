import { useState, useEffect } from "react"
import { Users, DollarSign, Activity, ArrowUpRight, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "../services/api"

interface DashboardMetrics {
  todayFollowUp: number;
  totalFollowUp: number;
  todayMeeting: number;
  totalMeeting: number;
  todayAfterMeeting: number;
  totalAfterMeeting: number;
  todayProspective: number;
  totalProspective: number;
  todayCommitted: number;
  totalCommitted: number;
  todayNI: number;
  totalNI: number;
  todayConverted: number;
  totalConverted: number;
  notOpenLeads: number;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/dashboard')
        setMetrics(res.data.data.metrics)
        setActivities(res.data.data.recentActivities)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (isLoading || !metrics) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    { title: "Today Follow-Up", value: metrics.todayFollowUp, color: "bg-cyan-50 text-cyan-900 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-100 dark:border-cyan-800" },
    { title: "Total Follow-Up", value: metrics.totalFollowUp, color: "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800" },
    { title: "Today Meeting", value: metrics.todayMeeting, color: "bg-indigo-50 text-indigo-900 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-100 dark:border-indigo-800" },
    { title: "Total Meeting", value: metrics.totalMeeting, color: "bg-violet-50 text-violet-900 border-violet-200 dark:bg-violet-950 dark:text-violet-100 dark:border-violet-800" },
    { title: "Today After Meeting", value: metrics.todayAfterMeeting, color: "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200 dark:bg-fuchsia-950 dark:text-fuchsia-100 dark:border-fuchsia-800" },
    { title: "Total After Meeting", value: metrics.totalAfterMeeting, color: "bg-pink-50 text-pink-900 border-pink-200 dark:bg-pink-950 dark:text-pink-100 dark:border-pink-800" },
    { title: "Today Prospective", value: metrics.todayProspective, color: "bg-orange-50 text-orange-900 border-orange-200 dark:bg-orange-950 dark:text-orange-100 dark:border-orange-800" },
    { title: "Total Prospective", value: metrics.totalProspective, color: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800" },
    { title: "Today Committed", value: metrics.todayCommitted, color: "bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-100 dark:border-yellow-800" },
    { title: "Total Committed", value: metrics.totalCommitted, color: "bg-lime-50 text-lime-900 border-lime-200 dark:bg-lime-950 dark:text-lime-100 dark:border-lime-800" },
    { title: "Today NI", value: metrics.todayNI, color: "bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800" },
    { title: "Total NI", value: metrics.totalNI, color: "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800" },
    { title: "Today Converted", value: metrics.todayConverted, color: "bg-teal-50 text-teal-900 border-teal-200 dark:bg-teal-950 dark:text-teal-100 dark:border-teal-800" },
    { title: "Total Converted", value: metrics.totalConverted, color: "bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950 dark:text-sky-100 dark:border-sky-800" },
    { title: "Not Open Leads", value: metrics.notOpenLeads, color: "bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your CRM metrics and recent activities."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((metric, idx) => (
          <Card key={idx} className="shadow-sm border-muted/60 transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              {/* Optional: We can add an icon here if we map one for each stat. Using Activity as fallback. */}
              <div className="p-2 rounded-full bg-primary/10">
                <Activity className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  )
}
