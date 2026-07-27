import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Calendar as CalendarIcon, Trash2 } from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"
import Swal from "sweetalert2"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataPagination } from "@/components/shared/DataPagination"
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery"

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'Todo' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
}

const COLUMNS = ['Todo', 'In Progress', 'Done'] as const;

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [page, setPage] = useState(1);
  
  // Dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'Todo',
    priority: 'Medium',
    dueDate: ''
  });
  const { data, isLoading: loading, refetch: fetchTasks } = usePaginatedQuery<Task>({
    endpoint: "/tasks/paged",
    page,
    limit: 25,
  });

  useEffect(() => {
    setTasks(data?.items || []);
  }, [data?.items]);

  const handleAddClick = () => {
    setEditingTaskId(null);
    setNewTask({ title: '', description: '', status: 'Todo', priority: 'Medium', dueDate: '' });
    setIsModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setEditingTaskId(task._id);
    setNewTask({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) {
      toast.error("Task title is required");
      return;
    }
    try {
      setSubmitting(true);
      if (editingTaskId) {
        await api.put(`/tasks/${editingTaskId}`, newTask);
        toast.success("Task updated successfully");
      } else {
        await api.post('/tasks', newTask);
        toast.success("Task added successfully");
      }
      setIsModalOpen(false);
      setEditingTaskId(null);
      setNewTask({ title: '', description: '', status: 'Todo', priority: 'Medium', dueDate: '' });
      await fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent opening the task modal
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this task?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t._id !== id));
      await fetchTasks();
      toast.success("Task deleted");
    } catch (err: any) {
      toast.error("Failed to delete task");
    }
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    const task = tasks.find(t => t._id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic UI update
    setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus as any } : t));

    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      await fetchTasks();
    } catch (error) {
      toast.error("Failed to update task status");
      fetchTasks(); // Revert on failure
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      <PageHeader title="Tasks" description="Manage your tasks using Kanban board.">
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </PageHeader>
      
      {loading && tasks.length === 0 ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-[500px]">
          {COLUMNS.map(column => (
            <div 
              key={column}
              className="bg-muted/30 rounded-xl p-4 flex flex-col gap-4 border shadow-sm"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column)}
            >
              <div className="flex items-center justify-between px-2">
                <h3 className="font-semibold text-lg">{column}</h3>
                <span className="bg-background text-muted-foreground text-xs font-medium px-2.5 py-1 rounded-full border">
                  {tasks.filter(t => t.status === column).length}
                </span>
              </div>
              
              <div className="flex flex-col gap-3 flex-1">
                {tasks.filter(t => t.status === column).map(task => (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task._id)}
                    onClick={() => handleTaskClick(task)}
                    className="bg-background p-4 rounded-lg border shadow-sm cursor-move hover:border-primary/50 transition-colors group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm pr-6 leading-tight">{task.title}</h4>
                      <button 
                        onClick={(e) => handleDeleteTask(e, task._id)}
                        className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 p-1 text-red-500 hover:bg-red-50 rounded transition-opacity"
                        title="Delete task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between mt-4">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      
                      {task.dueDate && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {tasks.filter(t => t.status === column).length === 0 && (
                  <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground opacity-50 flex-1">
                    <p className="text-sm">Drop tasks here</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {data?.pagination && (
        <DataPagination pagination={data.pagination} onPageChange={setPage} />
      )}

      {/* Task Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>{editingTaskId ? 'Edit Task' : 'Add New Task'}</DialogTitle>
              <DialogDescription>{editingTaskId ? 'Update task details.' : 'Create a new task for your board.'}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  placeholder="E.g. Update marketing assets"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add details..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={newTask.status} onValueChange={(val) => setNewTask({ ...newTask, status: val })}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todo">Todo</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(val) => setNewTask({ ...newTask, priority: val })}>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editingTaskId ? 'Update Task' : 'Save Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
