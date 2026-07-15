import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function Calendar() {
  return (
    <div className="flex flex-col gap-6 h-full">
      <PageHeader title="Calendar" description="View your calendar.">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </PageHeader>
      <div className="flex-1 min-h-[500px] border rounded-lg bg-card flex items-center justify-center text-muted-foreground">
        Calendar View Placeholder
      </div>
    </div>
  )
}
