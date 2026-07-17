import { useState, useEffect, useRef } from "react"
import { useNavigate } from "@tanstack/react-router"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus, Users, ThumbsUp, ThumbsDown, Target, CalendarDays, Handshake, CheckCircle2, Loader2, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import api from "@/services/api"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function Leads() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statsPeriod, setStatsPeriod] = useState("today")
  const today = new Date().toISOString().split("T")[0]
  const currentMonth = today.slice(0, 7)
  const currentYear = new Date().getFullYear().toString()
  const [dateRange, setDateRange] = useState({ startDate: today, endDate: today })
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const startDateRef = useRef<HTMLInputElement>(null)
  const endDateRef = useRef<HTMLInputElement>(null)
  const monthRef = useRef<HTMLInputElement>(null)

  const defaultStats = {
    totalLeads: 0,
    interested: 0,
    notInterested: 0,
    prospective: 0,
    committed: 0,
    converted: 0,
    followUp: 0
  }

  const [apiStats, setApiStats] = useState(defaultStats)

  useEffect(() => {
    fetchStats()
  }, [statsPeriod, dateRange.startDate, dateRange.endDate, selectedMonth, selectedYear])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = { period: statsPeriod }
      if (statsPeriod === "date") {
        params.startDate = dateRange.startDate
        params.endDate = dateRange.endDate
      } else if (statsPeriod === "month") {
        params.month = selectedMonth
      } else if (statsPeriod === "year") {
        params.year = selectedYear
      }
      const res = await api.get('/leads/stats', { params })
      setApiStats({ ...defaultStats, ...(res.data.data || {}) })
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch lead stats")
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { title: "Total Leads", value: apiStats.totalLeads, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Interested", value: apiStats.interested, icon: ThumbsUp, color: "text-emerald-500", bg: "bg-emerald-500/10", status: "Interested" },
    { title: "Not Interested", value: apiStats.notInterested, icon: ThumbsDown, color: "text-red-500", bg: "bg-red-500/10", status: "Not Interested" },
    { title: "Prospective", value: apiStats.prospective, icon: Target, color: "text-purple-500", bg: "bg-purple-500/10", status: "Prospective" },
    { title: "Committed", value: apiStats.committed, icon: Handshake, color: "text-orange-500", bg: "bg-orange-500/10", status: "Committed" },
    { title: "Converted", value: apiStats.converted, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", status: "Converted" },
    { title: "Follow Up", value: apiStats.followUp, icon: CalendarDays, color: "text-indigo-500", bg: "bg-indigo-500/10", status: "Follow Up" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Leads" description="Manage your sales leads.">
        <div className="flex items-center gap-3">
          <Select value={statsPeriod} onValueChange={setStatsPeriod}>
            <SelectTrigger className="w-[150px] bg-background">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="date">Date Range</SelectItem>
              <SelectItem value="month">Month Wise</SelectItem>
              <SelectItem value="year">Year Wise</SelectItem>
            </SelectContent>
          </Select>
          {statsPeriod === "date" && (
            <div className="flex items-center gap-2">
              <PickerInput
                inputRef={startDateRef}
                type="date"
                value={dateRange.startDate}
                onChange={(value) => setDateRange((prev) => ({ ...prev, startDate: value }))}
                className="w-[145px]"
              />
              <PickerInput
                inputRef={endDateRef}
                type="date"
                value={dateRange.endDate}
                onChange={(value) => setDateRange((prev) => ({ ...prev, endDate: value }))}
                className="w-[145px]"
              />
            </div>
          )}
          {statsPeriod === "month" && (
            <PickerInput
              inputRef={monthRef}
              type="month"
              value={selectedMonth}
              onChange={setSelectedMonth}
              className="w-[155px]"
            />
          )}
          {statsPeriod === "year" && (
            <Input
              type="number"
              min="1900"
              max="2100"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-[110px]"
            />
          )}
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New Lead
          </Button>
        </div>
      </PageHeader>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card 
            key={i} 
            className="shadow-sm border-muted/60 transition-all hover:shadow-md cursor-pointer hover:border-primary/50"
            onClick={() => {
              if (stat.title === "Total Leads") {
                navigate({ to: '/leads/all' });
              } else if ("status" in stat && stat.status) {
                navigate({ to: '/leads/all', search: { status: stat.status } as any });
              }
            }}
          >
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
              Create a new company lead.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6">
            <div 
              onClick={() => navigate({ to: '/companies/new' })}
              className="flex flex-col items-center justify-center gap-4 p-8 border rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
            >
              <div className="p-4 bg-blue-100 rounded-full text-blue-600">
                <Building2 className="h-8 w-8" />
              </div>
              <span className="font-semibold text-lg text-foreground">Company</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PickerInput({
  type,
  value,
  onChange,
  className,
  inputRef,
}: {
  type: "date" | "month";
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const openPicker = () => {
    const input = inputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null
    input?.focus()
    input?.showPicker?.()
  }

  return (
    <div className={`relative ${className || ""}`} onClick={openPicker}>
      <Input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0"
      />
      <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
