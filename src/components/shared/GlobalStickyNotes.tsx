import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { PinOff, Trash2 } from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"
import Swal from "sweetalert2"

interface Note {
  _id: string;
  title: string;
  content: string;
  color: string;
  isSticky: boolean;
  positionX: number;
  positionY: number;
}

export function GlobalStickyNotes() {
  const [stickyNotes, setStickyNotes] = useState<Note[]>([]);

  const fetchStickyNotes = async () => {
    try {
      const res = await api.get('/notes');
      if (res.data?.success) {
        setStickyNotes(res.data.data.filter((n: Note) => n.isSticky));
      }
    } catch (error) {
      console.error("Failed to fetch sticky notes", error);
    }
  };

  useEffect(() => {
    fetchStickyNotes();

    const handleNotesUpdate = () => {
      fetchStickyNotes();
    };

    window.addEventListener('notes-updated', handleNotesUpdate);
    
    return () => {
      window.removeEventListener('notes-updated', handleNotesUpdate);
    };
  }, []);

  const handleDragEnd = async (_e: any, info: any, note: Note) => {
    // Only update if moved significantly
    if (Math.abs(info.offset.x) > 2 || Math.abs(info.offset.y) > 2) {
      let newX = note.positionX + info.offset.x;
      let newY = note.positionY + info.offset.y;
      
      // Clamp coordinates to screen boundaries to prevent them from getting lost
      const maxWidth = window.innerWidth - 260; // 260 is approx note width
      const maxHeight = window.innerHeight - 150; // 150 is approx note height
      
      newX = Math.max(10, Math.min(newX, maxWidth));
      newY = Math.max(10, Math.min(newY, maxHeight));

      try {
        setStickyNotes(stickyNotes.map(n => n._id === note._id ? { ...n, positionX: newX, positionY: newY } : n));
        await api.put(`/notes/${note._id}`, { positionX: newX, positionY: newY });
        // Optionally dispatch event if other components need to know position changed, but not strictly necessary here.
      } catch (error) {
        console.error("Failed to save position", error);
      }
    }
  };

  const toggleSticky = async (note: Note) => {
    try {
      setStickyNotes(stickyNotes.filter(n => n._id !== note._id));
      await api.put(`/notes/${note._id}`, { isSticky: false });
      window.dispatchEvent(new Event('notes-updated')); // Notify Notes.tsx to re-fetch grid
    } catch (err) {
      toast.error("Failed to unpin note");
      fetchStickyNotes(); // revert
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
      setStickyNotes(stickyNotes.filter(n => n._id !== id));
      await api.delete(`/notes/${id}`);
      toast.success("Note deleted");
      window.dispatchEvent(new Event('notes-updated')); // Notify Notes.tsx to re-fetch
    } catch (err: any) {
      toast.error("Failed to delete note");
      fetchStickyNotes(); // revert
    }
  };

  if (stickyNotes.length === 0) return null;

  return (
    <>
      {stickyNotes.map(note => (
        <motion.div
          key={note._id}
          drag
          dragMomentum={false}
          onDragEnd={(e, info) => handleDragEnd(e, info, note)}
          initial={{ x: note.positionX, y: note.positionY }}
          style={{ 
            backgroundColor: note.color || '#fef3c7',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 9999, // Ensure it's on top of everything
          }}
          className="p-4 rounded-md shadow-lg cursor-grab active:cursor-grabbing border-t-8 border-t-amber-300 w-64 min-h-[150px] group"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-gray-800 text-sm truncate pr-6 select-none">{note.title || 'Note'}</h3>
            <div className="flex gap-1 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); toggleSticky(note); }} 
                className="p-1 bg-white/40 hover:bg-white/70 rounded-md text-gray-700" 
                title="Unpin"
              >
                <PinOff className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteNote(note._id); }} 
                className="p-1 bg-white/40 hover:bg-red-500/20 rounded-md text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <p className="text-gray-800 text-sm whitespace-pre-wrap select-text">{note.content}</p>
        </motion.div>
      ))}
    </>
  )
}
