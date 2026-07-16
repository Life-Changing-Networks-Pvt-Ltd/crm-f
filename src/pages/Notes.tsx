import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Trash2, Pin, PinOff } from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"
import Swal from "sweetalert2"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"

interface Note {
  _id: string;
  title: string;
  content: string;
  color: string;
  isSticky: boolean;
  positionX: number;
  positionY: number;
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    color: '#fef3c7'
  });

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notes');
      if (res.data?.success) {
        setNotes(res.data.data.filter((n: Note) => !n.isSticky));
      }
    } catch (error) {
      console.error("Failed to fetch notes", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    window.addEventListener('notes-updated', fetchNotes);
    return () => window.removeEventListener('notes-updated', fetchNotes);
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.content) {
      toast.error("Note content is required");
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/notes', newNote);
      toast.success("Note added successfully");
      setIsAddOpen(false);
      setNewNote({ title: '', content: '', color: '#fef3c7' });
      fetchNotes();
      window.dispatchEvent(new Event('notes-updated'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add note");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this note?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter(n => n._id !== id));
      toast.success("Note deleted");
      window.dispatchEvent(new Event('notes-updated'));
    } catch (err: any) {
      toast.error("Failed to delete note");
    }
  };

  const toggleSticky = async (note: Note) => {
    try {
      const updatedNote = { ...note, isSticky: !note.isSticky };
      // Optimistic UI update
      setNotes(notes.filter(n => n._id !== note._id));
      await api.put(`/notes/${note._id}`, { isSticky: updatedNote.isSticky });
      window.dispatchEvent(new Event('notes-updated'));
    } catch (err) {
      toast.error("Failed to update note status");
      fetchNotes(); // revert
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-10 relative overflow-hidden">
      <div className="flex items-center justify-between z-10 relative">
        <PageHeader title="Notes" description="Manage your thoughts and ideas.">
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Note
          </Button>
        </PageHeader>
      </div>
      
      {loading && notes.length === 0 && (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Regular Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 z-10 relative">
        {notes.map(note => (
          <div 
            key={note._id} 
            className="p-4 rounded-xl shadow-sm border relative group transition-transform hover:-translate-y-1"
            style={{ backgroundColor: note.color || '#fef3c7' }}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800 text-sm truncate pr-6">{note.title}</h3>
              <div className="flex gap-1 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => toggleSticky(note)} className="p-1 hover:bg-black/10 rounded-md text-gray-700" title="Stick to screen">
                  <Pin className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDeleteNote(note._id)} className="p-1 hover:bg-red-500/20 rounded-md text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{note.content}</p>
          </div>
        ))}
      </div>
      
      {!loading && notes.length === 0 && (
        <div className="flex flex-col items-center justify-center p-20 text-muted-foreground border-2 border-dashed rounded-xl z-10 relative">
          <p>No notes found. Create your first note!</p>
        </div>
      )}

      {/* Add Note Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Add New Note</DialogTitle>
              <DialogDescription>Jot down your thoughts.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="Meeting Notes"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content <span className="text-destructive">*</span></Label>
                <Textarea
                  id="content"
                  placeholder="What's on your mind?"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  required
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {[
                    { hex: '#fef3c7', name: 'Yellow' },
                    { hex: '#d1fae5', name: 'Green' },
                    { hex: '#e0e7ff', name: 'Blue' },
                    { hex: '#fce7f3', name: 'Pink' },
                  ].map(c => (
                    <div 
                      key={c.hex}
                      className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${newNote.color === c.hex ? 'border-gray-800 scale-110 shadow-sm' : 'border-transparent'}`}
                      style={{ backgroundColor: c.hex }}
                      onClick={() => setNewNote({ ...newNote, color: c.hex })}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Note
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
