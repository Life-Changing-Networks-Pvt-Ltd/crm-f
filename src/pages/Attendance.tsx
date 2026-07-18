import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CalendarDays, Loader2, MapPin, CheckCircle, Clock, MessageSquare, History } from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

const GAUR_CITY_MALL = { lat: 28.6060, lng: 77.4296 };
const DISTANCE_THRESHOLD = 500; // meters

export default function Attendance() {
  const { user } = useSelector((state: RootState) => state.auth)
  const isAdmin = user?.role === 'admin'

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  
  // Admin state
  const [dailyData, setDailyData] = useState<any[]>([])
  
  // Admin History Modal State
  const [adminHistoryOpen, setAdminHistoryOpen] = useState(false)
  const [selectedHistoryUser, setSelectedHistoryUser] = useState<any>(null)
  const [adminHistoryData, setAdminHistoryData] = useState<any[]>([])
  const [adminHistoryMonth, setAdminHistoryMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'))
  const [adminHistoryYear, setAdminHistoryYear] = useState(new Date().getFullYear().toString())
  const [adminHistoryLoading, setAdminHistoryLoading] = useState(false)

  // Employee state
  const [myHistory, setMyHistory] = useState<any[]>([])
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'))
  const [year, setYear] = useState(new Date().getFullYear().toString())
  
  const [employeeProfile, setEmployeeProfile] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [markingAttendance, setMarkingAttendance] = useState(false)
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)

  // Modals state
  const [confirmStatus, setConfirmStatus] = useState("")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [requestComment, setRequestComment] = useState("")
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isAdmin && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location not granted initially")
      )
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchDailyAttendance()
    } else {
      fetchMyHistory()
      fetchEmployeeProfile()
    }
  }, [isAdmin, date, month, year])

  useEffect(() => {
    if (selectedHistoryUser && adminHistoryOpen) {
      fetchUserHistory(selectedHistoryUser._id, adminHistoryMonth, adminHistoryYear)
    }
  }, [adminHistoryMonth, adminHistoryYear, selectedHistoryUser, adminHistoryOpen])

  const fetchDailyAttendance = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/attendance/daily?date=${date}`)
      setDailyData(res.data.data || [])
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || "Failed to fetch attendance")
    } finally {
      setLoading(false)
    }
  }

  const fetchMyHistory = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/attendance/my?month=${month}&year=${year}`)
      setMyHistory(res.data.data || [])
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch your history")
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployeeProfile = async () => {
    try {
      const res = await api.get('/employees/me')
      setEmployeeProfile(res.data.data)
    } catch {
      console.log("No profile found")
    }
  }

  const fetchUserHistory = async (userId: string, m: string, y: string) => {
    try {
      setAdminHistoryLoading(true)
      const res = await api.get(`/attendance/history/${userId}?month=${m}&year=${y}`)
      setAdminHistoryData(res.data.data || [])
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch history")
    } finally {
      setAdminHistoryLoading(false)
    }
  }

  const handleMarkAttendance = async (userId: string, status: string) => {
    try {
      await api.post('/attendance', { userId, date, status })
      toast.success("Attendance marked")
      setDailyData(prev => prev.map(item => {
        if (item.user._id === userId) {
          return {
            ...item,
            attendance: { ...item.attendance, status }
          }
        }
        return item;
      }))
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to mark attendance")
    }
  }

  const handlePreMark = (status: string) => {
    setConfirmStatus(status)
    setConfirmDialogOpen(true)
  }

  const handleSelfMarkAttendance = () => {
    setConfirmDialogOpen(false);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setMarkingAttendance(true);
    toast.loading("Checking your location...", { id: "location-toast" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        const dist = getDistanceFromLatLonInM(lat, lng, GAUR_CITY_MALL.lat, GAUR_CITY_MALL.lng);
        
        if (dist > DISTANCE_THRESHOLD) {
          toast.error("You are far from office", { id: "location-toast" });
          setMarkingAttendance(false);
          return;
        }
        
        try {
          await api.post('/attendance/mark-self', { status: confirmStatus, lat, lng });
          toast.success(`Successfully marked as ${confirmStatus}`, { id: "location-toast" });
          fetchMyHistory();
        } catch (err: any) {
           toast.error(err.response?.data?.message || "Failed to mark attendance", { id: "location-toast" });
        } finally {
          setMarkingAttendance(false);
        }
      },
      (error) => {
        console.error(error)
        toast.error("Please allow location access to mark attendance", { id: "location-toast" });
        setMarkingAttendance(false);
      },
      { enableHighAccuracy: true }
    );
  }

  const handleSelfCheckOut = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setMarkingAttendance(true);
    toast.loading("Checking your location...", { id: "location-toast" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        const dist = getDistanceFromLatLonInM(lat, lng, GAUR_CITY_MALL.lat, GAUR_CITY_MALL.lng);
        
        if (dist > DISTANCE_THRESHOLD) {
          toast.error("You are far from office", { id: "location-toast" });
          setMarkingAttendance(false);
          return;
        }
        
        try {
          await api.post('/attendance/checkout', { lat, lng });
          toast.success(`Successfully checked out!`, { id: "location-toast" });
          fetchMyHistory();
        } catch (err: any) {
           toast.error(err.response?.data?.message || "Failed to check out", { id: "location-toast" });
        } finally {
          setMarkingAttendance(false);
        }
      },
      (error) => {
        console.error(error)
        toast.error("Please allow location access to check out", { id: "location-toast" });
        setMarkingAttendance(false);
      },
      { enableHighAccuracy: true }
    );
  }

  const handleRequestChange = async () => {
    if (!requestComment) {
      toast.error("Please enter a comment")
      return
    }
    setRequesting(true)
    try {
      await api.post('/attendance/request-change', { comment: requestComment })
      toast.success("Change request sent to admin")
      setRequestDialogOpen(false)
      setRequestComment("")
      fetchMyHistory() // refresh to show updated notes
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send request")
    } finally {
      setRequesting(false)
    }
  }

  const handleViewHistoryClick = (userObj: any) => {
    setSelectedHistoryUser(userObj)
    setAdminHistoryOpen(true)
    // fetch is triggered by useEffect on selectedHistoryUser + adminHistoryOpen
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Present': return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Present</Badge>
      case 'Absent': return <Badge variant="destructive">Absent</Badge>
      case 'Half Day': return <Badge variant="secondary" className="bg-amber-500 text-white hover:bg-amber-600">Half Day</Badge>
      case 'On Leave': return <Badge variant="outline" className="border-blue-500 text-blue-500">On Leave</Badge>
      default: return <Badge variant="outline" className="text-muted-foreground border-dashed">Not Marked</Badge>
    }
  }

  const userInitials = user?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U'
  
  // Check if today is marked (timezone safe)
  const todayStr = new Date().toDateString()
  const markedTodayRecord = myHistory.find(h => new Date(h.date).toDateString() === todayStr)
  const isMarkedToday = !!markedTodayRecord

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={isAdmin ? "Team Attendance" : "My Attendance"} description={isAdmin ? "Mark and manage daily attendance for your team." : "View your monthly attendance history."} />

      {!isAdmin && (
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-sm">
                  <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">{userInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">{user?.name}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {employeeProfile?.employeeId || "EMP-XXXX"}
                    </Badge>
                    <span className="text-sm">{employeeProfile?.designation || user?.role}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center md:items-end justify-center bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-primary/10">
                <div className="text-3xl font-bold tracking-tighter tabular-nums flex items-center gap-2">
                  <Clock className="h-6 w-6 text-primary" />
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-muted-foreground font-medium mt-1 text-sm">
                  {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-primary/10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Mark Today's Attendance
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">You must be near Gaur City Mall to check in.</p>
                </div>
                
                {isMarkedToday ? (
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col text-right">
                      <span className="text-sm font-medium text-muted-foreground">Status for Today:</span>
                      <div className="mt-1">{getStatusBadge(markedTodayRecord.status)}</div>
                      {markedTodayRecord.checkOut && (
                        <span className="text-xs text-muted-foreground mt-1">Checked out: {new Date(markedTodayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                    {!markedTodayRecord.checkOut && (
                      <Button 
                        onClick={handleSelfCheckOut} 
                        disabled={markingAttendance}
                        variant="secondary"
                        className="bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                      >
                        {markingAttendance ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
                        Check Out
                      </Button>
                    )}
                    <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2 shadow-sm">
                          <MessageSquare className="h-4 w-4" />
                          Request Change
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request Attendance Change</DialogTitle>
                          <DialogDescription>
                            Submit a request to your admin if you made a mistake checking in today.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Textarea 
                            placeholder="Reason for change..." 
                            value={requestComment}
                            onChange={(e) => setRequestComment(e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>Cancel</Button>
                          <Button onClick={handleRequestChange} disabled={requesting}>
                            {requesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button 
                      onClick={() => handlePreMark('Present')} 
                      disabled={markingAttendance}
                      className="bg-emerald-500 hover:bg-emerald-600 shadow-sm"
                    >
                      {markingAttendance ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Present
                    </Button>
                    <Button 
                      onClick={() => handlePreMark('Half Day')} 
                      disabled={markingAttendance}
                      variant="secondary"
                      className="bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                    >
                      Half Day
                    </Button>
                    <Button 
                      onClick={() => handlePreMark('Absent')} 
                      disabled={markingAttendance}
                      variant="destructive"
                      className="shadow-sm"
                    >
                      Absent
                    </Button>
                  </div>
                )}
              </div>
              
              {location && (
                <div className="w-full mt-6 h-48 rounded-lg overflow-hidden border border-primary/20 shadow-inner">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng-0.005},${location.lat-0.005},${location.lng+0.005},${location.lat+0.005}&layer=mapnik&marker=${location.lat},${location.lng}`}
                  ></iframe>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog for Check-in */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Attendance</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark yourself as <strong>{confirmStatus}</strong> for today? You can only mark your attendance once per day.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSelfMarkAttendance}>Confirm Check-in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isAdmin ? (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-muted/20 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Daily Roster
            </CardTitle>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground mr-2">Select Date:</label>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="w-auto"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : dailyData.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No active employees found to mark attendance for.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Current Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyData.map((item) => (
                      <TableRow key={item.user._id}>
                        <TableCell>
                          <div className="font-medium">{item.user.name}</div>
                          <div className="text-xs text-muted-foreground">{item.user.email}</div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize text-sm">{item.user.role}</span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.attendance?.status)}
                        </TableCell>
                        <TableCell className="text-right flex items-center justify-end gap-2">
                           <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 flex items-center gap-1 text-primary hover:text-primary/80"
                            onClick={() => handleViewHistoryClick(item.user)}
                          >
                            <History className="h-4 w-4" />
                            <span className="hidden sm:inline">History</span>
                          </Button>
                          <Select 
                            value={item.attendance?.status || ""} 
                            onValueChange={(val) => handleMarkAttendance(item.user._id, val)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Mark Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Present">Present</SelectItem>
                              <SelectItem value="Absent">Absent</SelectItem>
                              <SelectItem value="Half Day">Half Day</SelectItem>
                              <SelectItem value="On Leave">On Leave</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-muted/20 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Attendance History
            </CardTitle>
            <div className="flex items-center gap-2">
               <Input 
                type="month" 
                value={`${year}-${month}`} 
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m] = e.target.value.split('-');
                    setYear(y);
                    setMonth(m);
                  }
                }} 
                className="w-auto"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
             {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : myHistory.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No attendance records found for this month.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myHistory.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell className="font-medium">
                          {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(record.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {record.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin View Employee History Dialog */}
      <Dialog open={adminHistoryOpen} onOpenChange={setAdminHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Attendance History: {selectedHistoryUser?.name}</DialogTitle>
            <DialogDescription>
              Viewing full attendance records for the selected month.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end mb-2">
             <Input 
                type="month" 
                value={`${adminHistoryYear}-${adminHistoryMonth}`} 
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m] = e.target.value.split('-');
                    setAdminHistoryYear(y);
                    setAdminHistoryMonth(m);
                  }
                }} 
                className="w-auto"
              />
          </div>

          <div className="max-h-[60vh] overflow-y-auto border rounded-md">
            <Table>
              <TableHeader className="bg-muted/30 sticky top-0">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes / Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminHistoryLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : adminHistoryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No records found for this month.
                    </TableCell>
                  </TableRow>
                ) : (
                  adminHistoryData.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell className="font-medium">
                        {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {record.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={() => setAdminHistoryOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
