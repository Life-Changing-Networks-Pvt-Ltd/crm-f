import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/layout/EmptyState"
import { Mail } from "lucide-react"

export default function EmailMarketing() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Email Marketing" description="Manage your email campaigns." />
      <EmptyState
        title="Coming Soon"
        description="This feature is currently under development."
        icon={<Mail className="h-10 w-10 text-muted-foreground" />}
      />
    </div>
  )
}
