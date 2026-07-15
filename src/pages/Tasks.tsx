import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/layout/EmptyState"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function Tasks() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tasks" description="Manage your tasks.">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </PageHeader>
      <EmptyState
        title="No tasks found"
        description="Get started by creating a new one."
        actionLabel="Create Tasks"
        onAction={() => {}}
      />
    </div>
  )
}
