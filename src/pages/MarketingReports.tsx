import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function MarketingReports() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="MarketingReports" description="View marketing reports." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">Chart Placeholder</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">Chart Placeholder</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
