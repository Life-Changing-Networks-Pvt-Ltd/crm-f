import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/layout/EmptyState"
import { Megaphone } from "lucide-react"

export default function Campaigns() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Campaigns" description="Manage marketing campaigns." />
      <EmptyState
        title="Coming Soon"
        description="This feature is currently under development."
        icon={<Megaphone className="h-10 w-10 text-muted-foreground" />}
      />
    </div>
  )
}
