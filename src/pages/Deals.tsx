import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function Deals() {
  return (
    <div className="flex flex-col gap-6 h-full">
      <PageHeader title="Deals" description="Manage your sales deals.">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </PageHeader>
      <div className="flex-1 min-h-[500px] flex gap-4 overflow-x-auto pb-4">
        {['To Do', 'In Progress', 'Done'].map(col => (
          <div key={col} className="w-[300px] min-w-[300px] shrink-0 bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-4">{col}</h3>
            <div className="h-24 bg-background rounded border shadow-sm mb-2"></div>
            <div className="h-24 bg-background rounded border shadow-sm"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
