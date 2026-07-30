import { useCallback, useEffect, useState } from "react"
import { Loader2, Search } from "lucide-react"

import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import api from "@/services/api"

interface AuditItem {
  _id: string
  actionType: string
  description: string
  entityType?: string
  user?: { name?: string; email?: string }
  createdAt: string
}

export default function AuditLogs() {
  const [items, setItems] = useState<AuditItem[]>([])
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get("/audit-logs", { params: { search: query, limit: 100 } })
      setItems(response.data.data || [])
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => { void load() }, [load])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit Logs"
        description="See important changes made by CRM users and when they happened."
      />
      <form
        className="flex max-w-xl gap-2"
        onSubmit={(event) => { event.preventDefault(); setQuery(search.trim()) }}
      >
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activity..." />
        <Button type="submit" variant="outline" className="gap-2">
          <Search className="h-4 w-4" /> Search
        </Button>
      </form>
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No activity found.</TableCell></TableRow>
            ) : items.map((item) => (
              <TableRow key={item._id}>
                <TableCell className="whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="font-medium">{item.user?.name || "Unknown user"}</div>
                  <div className="text-xs text-muted-foreground">{item.user?.email}</div>
                </TableCell>
                <TableCell>{item.actionType}</TableCell>
                <TableCell>{item.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
