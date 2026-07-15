import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/layout/EmptyState"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function Integrations() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Integrations" description="Manage system integrations.">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </PageHeader>
      <EmptyState
        title="No integrations found"
        description="Get started by creating a new one."
        actionLabel="Create Integrations"
        onAction={() => {}}
      />
    </div>
  )
}
