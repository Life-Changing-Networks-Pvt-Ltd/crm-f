import { useMemo, useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { ChevronLeft, ChevronRight, Code2, Copy, Eye, FileText, LayoutGrid, MoreVertical, Pencil, Plus, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEmailMarketingStore } from "../EmailMarketingStore"
import { EmptyPanel, ModulePage, PageContainer, PageHeading, SearchField, formatDate } from "../components/PageElements"
import { templatePresets, type TemplatePreset } from "../data/presets"
import { getEmailMarketingPath } from "../navigation"
import type { EmailTemplate } from "../types"
import { templateToHtml } from "./templateUtils"

const pageSize = 4
const editorOptions = [
  { type: "visual" as const, title: "Visual builder", description: "Build an email from reusable content blocks.", icon: LayoutGrid, path: "/email-builder/new" },
  { type: "simple" as const, title: "Simple editor", description: "Write a clean text-focused email with a live preview.", icon: FileText, path: "/simple-editor/new" },
  { type: "html" as const, title: "Custom HTML", description: "Paste or write complete HTML email source.", icon: Code2, path: "/html-editor/new" },
]

function editorPath(template: EmailTemplate) {
  const base = template.type === "html" ? "/html-editor" : template.type === "simple" ? "/simple-editor" : "/email-builder"
  return `${base}/${template.id}`
}

export function TemplatesPage() {
  const navigate = useNavigate()
  const { templates, permissions, createTemplate, duplicateTemplate, deleteTemplate, updateTemplate } = useEmailMarketingStore()
  const canCreate = permissions.includes("create_content") || permissions.includes("edit_content")
  const canEdit = permissions.includes("edit_content")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [preview, setPreview] = useState<EmailTemplate | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const filtered = useMemo(() => templates.filter((template) => {
    const matchesSearch = !query || `${template.name} ${template.subject} ${template.category}`.toLowerCase().includes(query.toLowerCase())
    return matchesSearch && (status === "all" || template.status === status)
  }), [templates, query, status])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleTemplates = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const firstResult = filtered.length ? (currentPage - 1) * pageSize + 1 : 0
  const lastResult = Math.min(currentPage * pageSize, filtered.length)
  const allVisibleSelected = Boolean(visibleTemplates.length) && visibleTemplates.every((template) => selectedIds.includes(template.id))

  const handlePreset = async (preset: TemplatePreset) => {
    try {
      const created = await createTemplate({
        name: preset.name,
        subject: preset.subject,
        preheader: preset.preheader,
        type: preset.type,
        status: "draft",
        category: preset.category,
        blocks: preset.blocks.map((block) => ({ ...block, id: `${block.id}-${Date.now()}` })),
        htmlContent: "",
      })
      setCreateOpen(false)
      toast.success("Preset added to your templates")
      void navigate({ to: getEmailMarketingPath(editorPath(created)) as never })
    } catch {
      toast.error("Template preset could not be saved.")
    }
  }

  const toggleVisible = (checked: boolean) => {
    const visibleIds = visibleTemplates.map((template) => template.id)
    setSelectedIds((current) => checked ? Array.from(new Set([...current, ...visibleIds])) : current.filter((id) => !visibleIds.includes(id)))
  }

  return (
    <ModulePage>
      <PageContainer>
        <PageHeading title="Templates" description="" actions={canCreate ? <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Create Template</Button> : undefined} />

        <section className="rounded-xl border bg-card px-5 py-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,340px)] md:items-center">
            <div>
              <p className="text-sm font-semibold">Templates created: {templates.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Template creation is unlimited. Credits are used only when emails are sent.</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-primary/10"><div className="h-full w-full rounded-full bg-primary" /></div>
          </div>
        </section>

        <section className="overflow-visible rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b p-4 xl:flex-row xl:items-center">
            <div className="flex items-center gap-3 xl:flex-1">
              {canEdit ? <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border bg-background shadow-sm" title="Select visible templates">
                <Checkbox checked={allVisibleSelected} onCheckedChange={(checked) => toggleVisible(Boolean(checked))} />
              </label> : null}
              <SearchField value={query} onChange={(value) => { setQuery(value); setPage(1) }} placeholder="Search for templates" className="min-w-0 flex-1 xl:max-w-md" />
              <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1) }}>
                <SelectTrigger className="w-44 shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-end gap-3 text-xs">
              <span className="font-semibold">{firstResult}-{lastResult} of {filtered.length}</span>
              <span className="flex h-10 min-w-10 items-center justify-center rounded-full border bg-background px-3">{pageSize}</span>
              <span className="text-muted-foreground">of {pageCount} page{pageCount === 1 ? "" : "s"}</span>
              <Button type="button" size="icon" variant="outline" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button type="button" size="icon" variant="outline" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          {visibleTemplates.length ? (
            <div className="divide-y">
              {visibleTemplates.map((template, index) => (
                <article key={template.id} className="relative flex flex-col gap-4 p-4 transition hover:bg-muted/20 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    {canEdit ? <Checkbox className="mt-1" checked={selectedIds.includes(template.id)} onCheckedChange={(checked) => setSelectedIds((current) => checked ? [...current, template.id] : current.filter((id) => id !== template.id))} /> : null}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">{template.name}</h3>
                        <Button type="button" size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={() => setPreview(template)} title="Preview template"><Eye className="h-4 w-4" /></Button>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">#{(currentPage - 1) * pageSize + index + 1}, Updated on {formatDate(template.updatedAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    {!canEdit ? <Button variant="outline" asChild><Link to="/leads"><Send className="mr-2 h-4 w-4" />Use on a lead</Link></Button> : null}
                    {canEdit ? <Button size="icon" variant="outline" asChild title="Edit template"><Link to={getEmailMarketingPath(editorPath(template)) as never}><Pencil className="h-4 w-4" /></Link></Button> : null}
                    {canEdit ? <Button size="icon" variant="outline" onClick={() => setActionId(actionId === template.id ? null : template.id)} title="More actions"><MoreVertical className="h-4 w-4" /></Button> : null}
                  </div>
                  {actionId === template.id ? <div className="absolute right-4 top-[calc(100%-10px)] z-20 w-44 rounded-lg border bg-popover p-1 shadow-lg">
                    <button className="flex w-full items-center rounded-md px-3 py-2 text-sm hover:bg-accent" onClick={() => { duplicateTemplate(template.id); setActionId(null); toast.success("Template duplicated") }}><Copy className="mr-2 h-4 w-4" />Duplicate</button>
                    <button className="flex w-full items-center rounded-md px-3 py-2 text-sm hover:bg-accent" onClick={() => { updateTemplate(template.id, { status: template.status === "active" ? "draft" : "active" }); setActionId(null) }}>{template.status === "active" ? "Move to draft" : "Mark active"}</button>
                    <button className="flex w-full items-center rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10" onClick={() => { if (window.confirm(`Delete ${template.name}?`)) { deleteTemplate(template.id); toast.success("Template deleted") } setActionId(null) }}><Trash2 className="mr-2 h-4 w-4" />Delete</button>
                  </div> : null}
                </article>
              ))}
            </div>
          ) : <div className="p-4"><EmptyPanel title={templates.length ? "No matching templates" : canCreate ? "Create your first email template" : "No shared templates"} description={templates.length ? "Try changing the search or status filter." : canCreate ? "Choose an editor or start from a ready-made layout." : "Ask an administrator to share an active template with you."} action={!templates.length && canCreate ? <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Create template</Button> : undefined} /></div>}
        </section>
      </PageContainer>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader><DialogTitle>Create a template</DialogTitle><DialogDescription>Choose an editor or start from a ready-made CRM template.</DialogDescription></DialogHeader>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Choose an editor</p>
            <div className="grid gap-3 md:grid-cols-3">{editorOptions.map((option) => { const Icon = option.icon; return <Link key={option.type} to={getEmailMarketingPath(option.path) as never} onClick={() => setCreateOpen(false)} className="rounded-xl border p-4 transition hover:border-primary/40 hover:bg-primary/5"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><h3 className="mt-3 text-sm font-semibold">{option.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{option.description}</p></Link> })}</div>
          </div>
          <div className="mt-5 border-t pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ready-made layouts</p>
            <div className="grid gap-3 md:grid-cols-3">{templatePresets.map((preset) => <button key={preset.id} type="button" onClick={() => handlePreset(preset)} className="rounded-xl border p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"><h3 className="text-sm font-semibold">{preset.name}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{preset.description}</p></button>)}</div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}><DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>{preview?.name}</DialogTitle><DialogDescription>{preview?.subject}</DialogDescription></DialogHeader>{preview ? <div className="h-[65vh] overflow-auto rounded-xl border bg-muted p-4"><iframe title="Template preview" srcDoc={templateToHtml(preview)} sandbox="" className="mx-auto min-h-full w-full max-w-2xl rounded-lg border-0 bg-white shadow-sm" /></div> : null}</DialogContent></Dialog>
    </ModulePage>
  )
}
