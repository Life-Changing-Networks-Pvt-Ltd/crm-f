import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/layout/EmptyState"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function Notes() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Notes" description="Manage your notes.">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </PageHeader>
      <EmptyState
        title="No notes found"
        description="Get started by creating a new one."
        actionLabel="Create Notes"
        onAction={() => {}}
      />
    </div>
  )
}
