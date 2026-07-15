import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/layout/EmptyState"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function Activities() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Activities" description="View all activities.">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </PageHeader>
      <EmptyState
        title="No activities found"
        description="Get started by creating a new one."
        actionLabel="Create Activities"
        onAction={() => {}}
      />
    </div>
  )
}
