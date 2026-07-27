import { useMemo, useState } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus, ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, Trash2 } from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"
import Swal from "sweetalert2"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery"

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Event {
  _id: string;
  title: string;
  date: string;
  type: string;
}

interface Task {
  _id: string;
  title: string;
  dueDate: string;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Meeting'
  });

  const range = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return {
      startDate: new Date(year, month, 1).toLocaleDateString('en-CA'),
      endDate: new Date(year, month + 1, 0).toLocaleDateString('en-CA'),
    };
  }, [currentDate]);
  const eventsQuery = usePaginatedQuery<Event>({
    endpoint: "/events/paged",
    page: 1,
    limit: 100,
    params: range,
  });
  const tasksQuery = usePaginatedQuery<Task>({
    endpoint: "/tasks/paged",
    page: 1,
    limit: 100,
    params: range,
  });
  const events = eventsQuery.data?.items || [];
  const tasks = tasksQuery.data?.items || [];
  const loading = eventsQuery.isLoading || tasksQuery.isLoading;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/events', newEvent);
      toast.success("Event added successfully");
      setIsAddOpen(false);
      setNewEvent({ ...newEvent, title: '' }); // reset title
      await Promise.all([eventsQuery.refetch(), tasksQuery.refetch()]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this event?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await api.delete(`/events/${id}`);
      toast.success("Event deleted");
      await eventsQuery.refetch();
    } catch (err: any) {
      toast.error("Failed to delete event");
    }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  const getEventStyle = (type: string) => {
    switch (type) {
      case 'Meeting': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Call': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Task': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // Blank spaces for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`blank-${i}`} className="min-h-[120px] p-2 border-r border-b bg-muted/20"></div>);
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = isCurrentMonth && today.getDate() === i;
      
      const dayDateString = new Date(year, month, i).toLocaleDateString('en-CA');
      
      const dayEvents = events.filter(ev => {
        const evDate = new Date(ev.date).toLocaleDateString('en-CA');
        return evDate === dayDateString;
      });

      const dayTasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        const tDate = new Date(t.dueDate).toLocaleDateString('en-CA');
        return tDate === dayDateString;
      });

      days.push(
        <div key={`day-${i}`} className={`min-h-[120px] p-2 border-r border-b transition-colors flex flex-col ${isToday ? 'bg-primary/5' : 'hover:bg-muted/10'}`}>
          <div className="flex justify-between items-start">
            <div className={`text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}>
              {i}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-muted-foreground opacity-0 hover:opacity-100 group-hover:opacity-100"
              onClick={() => {
                setNewEvent(prev => ({...prev, date: dayDateString}));
                setIsAddOpen(true);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[80px] no-scrollbar">
            {dayEvents.map(ev => (
              <div 
                key={ev._id} 
                className={`group relative mt-1 px-2 py-1 text-xs rounded font-medium flex items-center justify-between ${getEventStyle(ev.type)}`}
                title={ev.title}
              >
                <span className="truncate">{ev.title}</span>
                <Trash2 
                  className="h-3 w-3 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-red-500 shrink-0 ml-1" 
                  onClick={(e) => handleDeleteEvent(e, ev._id)} 
                />
              </div>
            ))}
            
            {dayTasks.map(t => (
              <div 
                key={t._id} 
                className={`mt-1 px-2 py-1 text-xs rounded font-medium flex items-center justify-between bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400`}
                title={`Task: ${t.title}`}
              >
                <span className="truncate">Task: {t.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Fill remaining grid to complete week
    const totalSlots = firstDay + daysInMonth;
    const remainingSlots = Math.ceil(totalSlots / 7) * 7 - totalSlots;
    for (let i = 0; i < remainingSlots; i++) {
      days.push(<div key={`blank-end-${i}`} className="min-h-[120px] p-2 border-r border-b bg-muted/20"></div>);
    }

    return days;
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-10 relative">
      <PageHeader title="Calendar" description="Manage your schedule and events.">
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </PageHeader>
      
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden flex flex-col relative">
        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold tracking-tight">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday} className="mr-2">
              Today
            </Button>
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-none border-r hover:bg-muted">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 rounded-none hover:bg-muted">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {DAYS.map(day => (
            <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 border-l-0 bg-background group">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" /> Add New Event
              </DialogTitle>
              <DialogDescription>
                Create a new event in your calendar.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  placeholder="E.g. Project Kickoff"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date <span className="text-destructive">*</span></Label>
                <Input
                  id="date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Event Type</Label>
                <Select value={newEvent.type} onValueChange={(val) => setNewEvent({ ...newEvent, type: val })}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                    <SelectItem value="Call">Call</SelectItem>
                    <SelectItem value="Task">Task</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
