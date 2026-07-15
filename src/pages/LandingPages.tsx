import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/layout/EmptyState"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function LandingPages() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="LandingPages" description="Manage landing pages.">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </PageHeader>
      <EmptyState
        title="No landingpages found"
        description="Get started by creating a new one."
        actionLabel="Create LandingPages"
        onAction={() => {}}
      />
    </div>
  )
}
