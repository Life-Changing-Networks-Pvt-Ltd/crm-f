import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Loader2,
  Calendar as CalendarIcon,
  Archive,
  User as UserIcon,
  AlertCircle,
  MessageSquare,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Search,
} from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"
import Swal from "sweetalert2"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DataPagination } from "@/components/shared/DataPagination"
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery"
import { useUsersQuery } from "@/hooks/useCrmReferenceData"
import { can } from "@/lib/accessControl"

interface TaskUser {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

interface TaskComment {
  _id?: string;
  user?: TaskUser;
  text: string;
  createdAt: string;
}

interface TaskActivity {
  _id?: string;
  user?: TaskUser;
  action: string;
  message: string;
  createdAt: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'Todo' | 'In Progress' | 'In Review' | 'Done' | 'Blocked';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate?: string;
  assignedTo?: TaskUser | null;
  createdBy?: TaskUser | null;
  department?: string;
  taskType?: 'Task' | 'Bug' | 'Feature' | 'SEO' | 'Improvement';
  comments?: TaskComment[];
  activity?: TaskActivity[];
  blockedReason?: string;
  reviewComment?: string;
  createdAt?: string;
}

const COLUMNS = ['Todo', 'In Progress', 'In Review', 'Blocked', 'Done'] as const;

const DEPARTMENTS = [
  'Development',
  'SEO',
  'Sales',
  'Design',
  'Marketing',
  'General',
] as const;

const TASK_TYPES = [
  'Task',
  'Bug',
  'Feature',
  'SEO',
  'Improvement',
] as const;

const formatDateTimeLocal = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const minimumFutureDateTimeLocal = () => {
  const nextMinute = new Date(Date.now() + 60_000);
  nextMinute.setSeconds(0, 0);
  return formatDateTimeLocal(nextMinute.toISOString());
};

const formatDueDateWithTime = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
};

export default function Tasks() {
  const { user } = useSelector((state: RootState) => state.auth);
  const canCreateTasks = can(user, "tasks.create");
  const canEditTasks = can(user, "tasks.edit");
  const canReviewTasks = can(user, "tasks.review");
  const canAssignTasks = can(user, "tasks.assign");
  const canDeleteTasks = can(user, "tasks.delete");
  const canCommentOnTasks = can(user, "tasks.view");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [page, setPage] = useState(1);

  // Filter States
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isMyTasksOnly, setIsMyTasksOnly] = useState<boolean>(false);

  // Dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [minimumDueDate, setMinimumDueDate] = useState(minimumFutureDateTimeLocal);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Todo' as Task['status'],
    priority: 'Medium' as Task['priority'],
    department: 'Development',
    taskType: 'Task' as Task['taskType'],
    assignedTo: 'unassigned',
    dueDate: '',
  });

  // Fetch assignable users (developers, seo, staff) using existing CRM reference hook
  const { data: assignableUsers = [] } = useUsersQuery<TaskUser[]>("assignment");

  const { data, isLoading: loading, refetch: fetchTasks } = usePaginatedQuery<Task>({
    endpoint: "/tasks/paged",
    page,
    limit: 10,
    params: {
      assignedTo: selectedAssignee !== "all" ? selectedAssignee : undefined,
      department: selectedDepartment !== "all" ? selectedDepartment : undefined,
      myTasks: isMyTasksOnly ? "true" : undefined,
      status: selectedStatus !== "all" ? selectedStatus : undefined,
      priority: selectedPriority !== "all" ? selectedPriority : undefined,
      search: search.trim() || undefined,
    },
  });

  useEffect(() => {
    setTasks(data?.items || []);
  }, [data?.items]);

  const handleAddClick = () => {
    if (!canCreateTasks) return;
    setMinimumDueDate(minimumFutureDateTimeLocal());
    setEditingTask(null);
    setNewComment("");
    setStatusNote("");
    setFormData({
      title: '',
      description: '',
      status: 'Todo',
      priority: 'Medium',
      department: 'Development',
      taskType: 'Task',
      assignedTo: canAssignTasks ? 'unassigned' : (user?._id || 'unassigned'),
      dueDate: '',
    });
    setIsModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setMinimumDueDate(minimumFutureDateTimeLocal());
    setEditingTask(task);
    setNewComment("");
    setStatusNote(task.blockedReason || task.reviewComment || "");
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      department: task.department || 'General',
      taskType: task.taskType || 'Task',
      assignedTo: task.assignedTo?._id || 'unassigned',
      dueDate: formatDateTimeLocal(task.dueDate),
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask && !canEditTasks && !canAssignTasks && !canReviewTasks) return;
    if (!editingTask && !canCreateTasks) return;
    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    if (!editingTask && (!formData.assignedTo || formData.assignedTo === 'unassigned')) {
      toast.error("Please select an employee to assign this task");
      return;
    }
    const originalDueDate = editingTask ? formatDateTimeLocal(editingTask.dueDate) : '';
    const dueDateChanged = formData.dueDate !== originalDueDate;
    if (formData.dueDate && (!editingTask || dueDateChanged)) {
      const selectedDueDate = new Date(formData.dueDate);
      if (Number.isNaN(selectedDueDate.getTime()) || selectedDueDate.getTime() <= Date.now()) {
        toast.error("Due date and time must be in the future");
        return;
      }
    }
    try {
      setSubmitting(true);
      const normalizedAssignee = formData.assignedTo === 'unassigned' ? null : formData.assignedTo;
      const payload: Record<string, unknown> = {};

      if (editingTask) {
        if (canEditTasks) {
          Object.assign(payload, {
            title: formData.title,
            description: formData.description,
            status: formData.status,
            priority: formData.priority,
            department: formData.department,
            taskType: formData.taskType,
          });
          if (dueDateChanged) {
            payload.dueDate = formData.dueDate
              ? new Date(formData.dueDate).toISOString()
              : null;
          }
        }
        if (canReviewTasks && !canEditTasks) payload.status = formData.status;
        if (canAssignTasks) payload.assignedTo = normalizedAssignee;
        if (formData.status !== editingTask.status) payload.statusNote = statusNote.trim();
        await api.put(`/tasks/${editingTask._id}`, payload);
        toast.success("Task updated successfully");
      } else {
        Object.assign(payload, {
          ...formData,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          assignedTo: normalizedAssignee,
        });
        await api.post('/tasks', payload);
        toast.success("Task created and assigned successfully");
      }
      setIsModalOpen(false);
      setEditingTask(null);
      await fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!editingTask || !canCommentOnTasks || !newComment.trim()) return;
    try {
      setSubmittingComment(true);
      const res = await api.put(`/tasks/${editingTask._id}`, { comment: newComment.trim() });
      toast.success("Comment added");
      setNewComment("");
      if (res.data?.data) {
        setEditingTask(res.data.data);
      }
      await fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleArchiveTask = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!canDeleteTasks) return;
    const result = await Swal.fire({
      title: 'Archive this task?',
      text: "It will be removed from the active task board.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, archive it',
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t._id !== id));
      await fetchTasks();
      toast.success("Task archived");
      if (editingTask?._id === id) {
        setIsModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to archive task");
    }
  };

  const isStatusOptionDisabled = (nextStatus: Task['status']) => {
    if (!editingTask) return nextStatus !== 'Todo';
    if (nextStatus === editingTask.status) return false;
    if (canReviewTasks) return nextStatus === 'Done' && editingTask.status !== 'In Review';
    if (!canEditTasks || editingTask.assignedTo?._id !== user?._id) return true;
    const transitions: Record<Task['status'], Task['status'][]> = {
      Todo: ['In Progress', 'Blocked'],
      'In Progress': ['In Review', 'Blocked'],
      'In Review': ['In Progress'],
      Blocked: ['In Progress'],
      Done: [],
    };
    return !transitions[editingTask.status].includes(nextStatus);
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    const task = tasks.find((item) => item._id === taskId);
    const isAssignedEmployee = String(task?.assignedTo?._id || '') === String(user?._id || '');
    if (!task || (!canReviewTasks && (!canEditTasks || !isAssignedEmployee))) return;
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    if (!canEditTasks && !canReviewTasks) return;
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    const task = tasks.find(t => t._id === taskId);
    if (!task || task.status === newStatus) return;
    const isAssignedEmployee = String(task.assignedTo?._id || '') === String(user?._id || '');
    if (!canReviewTasks && !isAssignedEmployee) return;
    if (newStatus === 'Done' && !canReviewTasks) {
      toast.error("Submit the task for review; only a reviewer can approve it");
      return;
    }
    if (newStatus === 'Blocked') {
      toast.error("Open the task and provide a blocked reason");
      return;
    }
    if (canReviewTasks && task.status === 'In Review' && newStatus === 'In Progress') {
      toast.error("Open the task and add the requested changes note");
      return;
    }

    // Optimistic UI update
    setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));

    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      toast.success(`Task moved to ${newStatus}`);
      await fetchTasks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update task status");
      fetchTasks();
    }
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'Urgent':
        return <Badge variant="destructive" className="text-[10px] uppercase font-bold px-1.5 py-0.5">Urgent</Badge>;
      case 'High':
        return <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300">High</span>;
      case 'Medium':
        return <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300">Medium</span>;
      case 'Low':
        return <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300">Low</span>;
      default:
        return null;
    }
  };

  const getTaskTypeBadge = (type?: string) => {
    switch (type) {
      case 'Bug':
        return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">Bug</span>;
      case 'Feature':
        return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Feature</span>;
      case 'SEO':
        return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">SEO</span>;
      case 'Improvement':
        return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">Improvement</span>;
      default:
        return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Task</span>;
    }
  };

  const isOverdue = (dueDate?: string, status?: string) => {
    if (!dueDate || status === 'Done') return false;
    const due = new Date(dueDate);
    return due.getTime() < Date.now();
  };

  return (
    <div className="flex flex-col gap-5 h-full pb-10">
      <PageHeader
        title="Tasks & Assignments"
        description="Assign work, track employee progress, and review completed tasks."
      >
        {canCreateTasks && (
          <Button onClick={handleAddClick} className="gap-2">
            <Plus className="h-4 w-4" /> Add Task
          </Button>
        )}
      </PageHeader>

      {/* Jira Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3 rounded-xl border">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center text-xs font-medium text-muted-foreground mr-1">
            <Filter className="h-3.5 w-3.5 mr-1.5" /> Filters:
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search tasks"
              className="h-9 w-[180px] pl-8 text-xs bg-background"
            />
          </div>

          {/* Filter by Assignee */}
          <Select value={selectedAssignee} onValueChange={(val) => { setSelectedAssignee(val); setPage(1); }}>
            <SelectTrigger className="h-9 w-[190px] text-xs bg-background">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {assignableUsers.map((u) => (
                <SelectItem key={u._id} value={u._id}>
                  {u.name} {u.role ? `(${u.role})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setPage(1); }}>
            <SelectTrigger className="h-9 w-[145px] text-xs bg-background">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {COLUMNS.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedPriority} onValueChange={(val) => { setSelectedPriority(val); setPage(1); }}>
            <SelectTrigger className="h-9 w-[130px] text-xs bg-background">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {['Low', 'Medium', 'High', 'Urgent'].map((priority) => (
                <SelectItem key={priority} value={priority}>{priority}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter by Department */}
          <Select value={selectedDepartment} onValueChange={(val) => { setSelectedDepartment(val); setPage(1); }}>
            <SelectTrigger className="h-9 w-[160px] text-xs bg-background">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Quick "My Tasks" Toggle */}
          <Button
            variant={isMyTasksOnly ? "default" : "outline"}
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => { setIsMyTasksOnly(!isMyTasksOnly); setPage(1); }}
          >
            <UserIcon className="h-3.5 w-3.5" />
            My Tasks
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{tasks.length}</span>
          {data?.pagination ? ` of ${data.pagination.total}` : ''} tasks
        </div>
      </div>

      {/* Kanban Board */}
      {loading && tasks.length === 0 ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="w-full overflow-x-auto pb-2">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[repeat(5,minmax(240px,1fr))] gap-4 flex-1 min-h-[550px] xl:min-w-[1240px]">
          {COLUMNS.map((column) => {
            const columnTasks = tasks.filter((t) => t.status === column);

            return (
              <div
                key={column}
                className="min-w-0 overflow-hidden bg-muted/30 rounded-xl p-3 flex flex-col gap-3 border shadow-sm"
                onDragOver={(canEditTasks || canReviewTasks) ? handleDragOver : undefined}
                onDrop={(canEditTasks || canReviewTasks) ? (e) => handleDrop(e, column) : undefined}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1 pb-1 border-b">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm tracking-tight">{column}</h3>
                    <span className="bg-background text-muted-foreground text-xs font-semibold px-2 py-0.5 rounded-full border">
                      {columnTasks.length}
                    </span>
                  </div>
                  {column === 'Done' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Cards Container */}
                <div className="flex flex-col gap-2.5 flex-1">
                  {columnTasks.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.status);

                    return (
                      <div
                        key={task._id}
                        draggable={canReviewTasks || (canEditTasks && task.assignedTo?._id === user?._id)}
                        onDragStart={(canReviewTasks || (canEditTasks && task.assignedTo?._id === user?._id)) ? (e) => handleDragStart(e, task._id) : undefined}
                        onClick={() => handleTaskClick(task)}
                        className={`min-w-0 overflow-hidden bg-background p-3.5 rounded-lg border shadow-sm hover:border-primary/50 hover:shadow transition-all group relative flex flex-col gap-2 ${(canReviewTasks || (canEditTasks && task.assignedTo?._id === user?._id)) ? "cursor-move" : "cursor-pointer"}`}
                      >
                        {/* Card Top: Type & Priority */}
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5 flex-wrap">
                            {getTaskTypeBadge(task.taskType)}
                            {task.department && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {task.department}
                              </span>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            {getPriorityBadge(task.priority)}
                            {canDeleteTasks && (
                              <button
                                onClick={(e) => handleArchiveTask(e, task._id)}
                                className="shrink-0 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 rounded transition-opacity"
                                title="Archive task"
                              >
                                <Archive className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="min-w-0 overflow-hidden">
                          <h4 className="font-medium text-sm leading-snug break-words [overflow-wrap:anywhere] group-hover:text-primary transition-colors">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words [overflow-wrap:anywhere]">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Card Bottom: Assignee, Due Date & Comments */}
                        <div className="flex min-w-0 flex-col gap-2 pt-2 border-t mt-1 text-xs">
                          {/* Assignee Avatar */}
                          <div className="flex min-w-0 items-center gap-1.5" title={`Assigned to: ${task.assignedTo?.name || 'Unassigned'}`}>
                            {task.assignedTo ? (
                              <div className="flex min-w-0 max-w-full items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                <UserIcon className="h-3 w-3 shrink-0" />
                                <span className="truncate">{task.assignedTo.name}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">Unassigned</span>
                            )}
                          </div>

                          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
                            {task.comments && task.comments.length > 0 && (
                              <div className="flex items-center text-muted-foreground text-[11px]" title={`${task.comments.length} comments`}>
                                <MessageSquare className="h-3 w-3 mr-0.5" />
                                {task.comments.length}
                              </div>
                            )}

                            {task.dueDate && (
                              <div
                                className={`flex min-w-0 items-center text-[11px] font-medium ${
                                  overdue ? 'text-destructive font-bold' : 'text-muted-foreground'
                                }`}
                                title={overdue ? "Overdue deadline!" : "Due date & time"}
                              >
                                {overdue && <AlertCircle className="h-3 w-3 mr-0.5 shrink-0 text-destructive" />}
                                <CalendarIcon className="h-3 w-3 mr-0.5 shrink-0" />
                                <span className="break-words [overflow-wrap:anywhere]">{formatDueDateWithTime(task.dueDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {columnTasks.length === 0 && (
                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground/60 flex-1">
                      <p className="text-xs">Drop tasks here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}

      {data?.pagination && (
        <DataPagination pagination={data.pagination} onPageChange={setPage} />
      )}

      {/* Task Modal (Create & Edit) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[840px] max-h-[92vh] overflow-y-auto p-5 sm:p-6">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader className="pb-2.5 border-b">
              <DialogTitle className="flex items-center gap-2 text-lg">
                {editingTask
                  ? (canEditTasks || canAssignTasks || canReviewTasks ? 'Edit & Track Task' : 'View Task')
                  : 'Assign New Task'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {editingTask
                  ? (canEditTasks || canAssignTasks || canReviewTasks
                    ? 'Update progress, reassign, or add work comments.'
                    : 'You have view-only access to this task.')
                  : 'Assign tasks to developers, SEO team, or employees.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-3.5">
              {/* Left Column: Title, Large Description, Comments (7 cols) */}
              <div className="md:col-span-7 flex flex-col gap-3.5">
                {/* Title */}
                <div className="space-y-1">
                  <Label htmlFor="title" className="text-xs font-semibold">
                    Task Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="E.g. Build User Authentication API or SEO Schema"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    disabled={Boolean(editingTask) && !canEditTasks}
                    className="h-9 text-sm font-medium"
                    required
                  />
                </div>

                {/* Big Spacious Description */}
                <div className="space-y-1 flex-1 flex flex-col">
                  <Label htmlFor="description" className="text-xs font-semibold">
                    Description & Specifications
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed requirements, acceptance criteria, PR links, or guidelines..."
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={Boolean(editingTask) && !canEditTasks}
                    className="min-h-[140px] text-xs resize-y flex-1"
                  />
                </div>

                {/* Comments Section (Visible when editing) */}
                {editingTask && (
                  <div className="border-t pt-2.5 space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      Activity & Comments ({(editingTask.activity?.length || 0) + (editingTask.comments?.length || 0)})
                    </Label>

                    {editingTask.activity && editingTask.activity.length > 0 && (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto bg-muted/30 p-2.5 rounded-lg border text-xs">
                        {[...editingTask.activity].reverse().map((item, idx) => (
                          <div key={item._id || idx} className="flex items-start justify-between gap-3">
                            <span>
                              <span className="font-semibold">{item.user?.name || 'Team member'}</span>{' '}
                              <span className="text-muted-foreground">{item.message}</span>
                            </span>
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {editingTask.comments && editingTask.comments.length > 0 && (
                      <div className="space-y-2 max-h-32 overflow-y-auto bg-muted/30 p-2.5 rounded-lg border text-xs">
                        {editingTask.comments.map((c, idx) => (
                          <div key={c._id || idx} className="bg-background p-2 rounded border">
                            <div className="flex items-center justify-between text-muted-foreground text-[10px] mb-1">
                              <span className="font-semibold text-foreground">{c.user?.name || 'Team member'}</span>
                              <span>{new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-foreground whitespace-pre-wrap">{c.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {canCommentOnTasks && <div className="flex gap-2">
                      <Input
                        placeholder="Add an update or note (e.g. PR submitted, working on fix)..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="text-xs h-9"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleAddComment}
                        disabled={submittingComment || !newComment.trim()}
                        className="gap-1 text-xs shrink-0"
                      >
                        {submittingComment ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        Send
                      </Button>
                    </div>}
                  </div>
                )}
              </div>

              {/* Right Column: Settings & Metadata Inspector (5 cols) */}
              <div className="md:col-span-5 bg-muted/30 p-3.5 rounded-xl border flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1 border-b">
                  Task Properties
                </span>

                {/* Assignee */}
                <div className="space-y-1">
                  <Label htmlFor="assignee" className="text-xs font-semibold">
                    Assign To {!editingTask && <span className="text-destructive">*</span>}
                  </Label>
                  <Select
                    value={formData.assignedTo}
                    onValueChange={(val) => setFormData({ ...formData, assignedTo: val })}
                    disabled={!canAssignTasks}
                  >
                    <SelectTrigger id="assignee" className="h-9 text-xs bg-background">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned" disabled>
                        {editingTask ? 'Unassigned' : 'Select employee'}
                      </SelectItem>
                      {assignableUsers.map((u) => (
                        <SelectItem key={u._id} value={u._id}>
                          {u.name} {u.role ? `(${u.role})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Department & Task Type Side-by-Side */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="department" className="text-xs font-semibold">
                      Department
                    </Label>
                    <Select
                      value={formData.department}
                      onValueChange={(val) => setFormData({ ...formData, department: val })}
                      disabled={Boolean(editingTask) && !canEditTasks}
                    >
                      <SelectTrigger id="department" className="h-9 text-xs bg-background">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="taskType" className="text-xs font-semibold">Type</Label>
                    <Select
                      value={formData.taskType}
                      onValueChange={(val: any) => setFormData({ ...formData, taskType: val })}
                      disabled={Boolean(editingTask) && !canEditTasks}
                    >
                      <SelectTrigger id="taskType" className="h-9 text-xs bg-background">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Status & Priority Side-by-Side */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="status" className="text-xs font-semibold">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                      disabled={!editingTask || (!canReviewTasks && (!canEditTasks || editingTask.assignedTo?._id !== user?._id))}
                    >
                      <SelectTrigger id="status" className="h-9 text-xs bg-background">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLUMNS.map((status) => (
                          <SelectItem key={status} value={status} disabled={isStatusOptionDisabled(status)}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="priority" className="text-xs font-semibold">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(val: any) => setFormData({ ...formData, priority: val })}
                      disabled={Boolean(editingTask) && !canEditTasks}
                    >
                      <SelectTrigger id="priority" className="h-9 text-xs bg-background">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {editingTask && formData.status !== editingTask.status && (
                  (formData.status === 'Blocked')
                  || (editingTask.status === 'In Review' && formData.status === 'In Progress' && canReviewTasks)
                  || formData.status === 'Done'
                ) && (
                  <div className="space-y-1">
                    <Label htmlFor="statusNote" className="text-xs font-semibold">
                      {formData.status === 'Blocked'
                        ? 'Blocked Reason *'
                        : formData.status === 'Done'
                          ? 'Review Note'
                          : 'Requested Changes *'}
                    </Label>
                    <Textarea
                      id="statusNote"
                      value={statusNote}
                      onChange={(event) => setStatusNote(event.target.value)}
                      rows={3}
                      required={formData.status === 'Blocked' || (editingTask.status === 'In Review' && formData.status === 'In Progress')}
                      placeholder="Add a clear note for this status change"
                      className="text-xs bg-background"
                    />
                  </div>
                )}

                {/* Due Date & Time - Full Width with Instant Click-to-Open Calendar */}
                <div className="space-y-1">
                  <Label htmlFor="dueDate" className="text-xs font-semibold">
                    Due Date & Time (Deadline)
                  </Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    min={!editingTask ? minimumDueDate : undefined}
                    disabled={Boolean(editingTask) && !canEditTasks}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker?.();
                      } catch {}
                    }}
                    className="h-9 text-xs bg-background w-full cursor-pointer pr-3"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2.5 border-t">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              {(!editingTask || canEditTasks || canAssignTasks || canReviewTasks) && (
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingTask ? 'Update Task' : 'Assign Task'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
