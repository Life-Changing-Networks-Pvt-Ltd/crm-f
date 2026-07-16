import { useState, useEffect } from "react"
import { Loader2, ArrowRight, Calendar } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import api from "../services/api"

interface DashboardMetrics {
  new: number;
  interested: number;
  notInterested: number;
  prospective: number;
  committed: number;
  converted: number;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState(todayStr)

  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const res = await api.get(`/dashboard?startDate=${startDate}&endDate=${endDate}`)
        setMetrics(res.data.data.metrics)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [startDate, endDate])

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
    { 
      title: "New Leads", 
      value: metrics.new, 
      status: "New",
      color: "bg-card text-card-foreground border-border dark:bg-card dark:text-card-foreground dark:border-border",
      dot: "bg-blue-500"
    },
    { 
      title: "Interested", 
      value: metrics.interested, 
      status: "Interested",
      color: "bg-card text-card-foreground border-border dark:bg-card dark:text-card-foreground dark:border-border",
      dot: "bg-emerald-500"
    },
    { 
      title: "Not Interested", 
      value: metrics.notInterested, 
      status: "Not Interested",
      color: "bg-card text-card-foreground border-border dark:bg-card dark:text-card-foreground dark:border-border",
      dot: "bg-red-500"
    },
    { 
      title: "Prospective", 
      value: metrics.prospective, 
      status: "Prospective",
      color: "bg-card text-card-foreground border-border dark:bg-card dark:text-card-foreground dark:border-border",
      dot: "bg-purple-500"
    },
    { 
      title: "Committed", 
      value: metrics.committed, 
      status: "Committed",
      color: "bg-card text-card-foreground border-border dark:bg-card dark:text-card-foreground dark:border-border",
      dot: "bg-orange-500"
    },
    { 
      title: "Converted", 
      value: metrics.converted, 
      status: "Converted",
      color: "bg-card text-card-foreground border-border dark:bg-card dark:text-card-foreground dark:border-border",
      dot: "bg-green-500"
    }
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Pipeline Overview"
          description="Monitor the real-time status of all your Customers and Companies."
          className="pb-0"
        />
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
          <div className="flex items-center gap-2 bg-card border rounded-md px-2 py-1 shadow-sm">
            <span className="text-xs text-muted-foreground font-medium">From</span>
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="h-7 w-[125px] border-0 focus-visible:ring-0 p-0 text-sm bg-transparent"
            />
            <span className="text-xs text-muted-foreground font-medium border-l pl-2">To</span>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="h-7 w-[125px] border-0 focus-visible:ring-0 p-0 text-sm bg-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((metric, idx) => (
          <Card 
            key={idx} 
            className={`shadow-sm border-2 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg ${metric.color}`}
            onClick={() => navigate({ to: '/leads/all', search: { status: metric.status } })}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${metric.dot}`} />
                {metric.title}
              </CardTitle>
              <ArrowRight className="h-4 w-4 opacity-50" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mt-2">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
