import { useMemo, useState, type FormEvent } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowLeft, ArrowUp, Code2, Eye, Heading1, Image, Link2, Minus, MousePointerClick, Plus, Save, SeparatorHorizontal, Space, Trash2, Type } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useEmailMarketingStore } from "../EmailMarketingStore"
import { ModulePage, PageContainer, PageHeading } from "../components/PageElements"
import { getEmailMarketingPath } from "../navigation"
import type { EmailBlock, TemplateInput, TemplateStatus, TemplateType } from "../types"
import { templateToHtml } from "./templateUtils"

const blockTypes = [
  { type: "heading" as const, label: "Heading", icon: Heading1, content: "Your headline" },
  { type: "text" as const, label: "Text", icon: Type, content: "Write your message here." },
  { type: "button" as const, label: "Button", icon: MousePointerClick, content: "Learn more" },
  { type: "image" as const, label: "Image", icon: Image, content: "https://placehold.co/800x360/f5eadc/9a5a13?text=Your+Image" },
  { type: "divider" as const, label: "Divider", icon: SeparatorHorizontal, content: "" },
  { type: "spacer" as const, label: "Spacer", icon: Space, content: "32" },
]

function newBlock(definition: typeof blockTypes[number]): EmailBlock {
  return { id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type: definition.type, content: definition.content, href: definition.type === "button" ? "https://example.com" : undefined, align: "left" }
}

function initialTemplate(type: TemplateType): TemplateInput {
  return {
    name: "Untitled email",
    subject: "",
    preheader: "",
    type,
    status: "draft",
    category: "General",
    htmlContent: type === "html" ? '<!doctype html>\n<html>\n  <body style="margin:0;background:#f4f1ec;padding:32px">\n    <div style="max-width:640px;margin:auto;background:#fff;padding:40px;border-radius:16px">\n      <h1>Hello {{first_name}}</h1>\n      <p>Write your email here.</p>\n    </div>\n  </body>\n</html>' : "",
    blocks: type === "html" ? [] : [newBlock(blockTypes[0]), newBlock(blockTypes[1])],
  }
}

export function TemplateEditorPage({ mode, id }: { mode: TemplateType; id?: string }) {
  const navigate = useNavigate()
  const { templates, createTemplate, updateTemplate } = useEmailMarketingStore()
  const existing = templates.find((template) => template.id === id)
  const [form, setForm] = useState<TemplateInput>(() => existing ? {
    name: existing.name,
    subject: existing.subject,
    preheader: existing.preheader,
    type: existing.type,
    status: existing.status,
    category: existing.category,
    htmlContent: existing.htmlContent,
    blocks: existing.blocks,
  } : initialTemplate(mode))
  const [selectedBlockId, setSelectedBlockId] = useState(form.blocks[0]?.id || "")
  const [preview, setPreview] = useState(false)
  const selectedBlock = form.blocks.find((block) => block.id === selectedBlockId)
  const editorTitle = mode === "visual" ? "Visual email builder" : mode === "simple" ? "Simple email editor" : "Custom HTML editor"
  const previewHtml = useMemo(() => templateToHtml(form), [form])

  if (id && !existing) {
    return <ModulePage><PageContainer className="max-w-3xl"><div className="rounded-2xl border bg-card p-10 text-center"><h2 className="text-xl font-semibold">Template not found</h2><Button className="mt-5" asChild><Link to={getEmailMarketingPath("/templates") as never}>Back to templates</Link></Button></div></PageContainer></ModulePage>
  }

  const setField = <K extends keyof TemplateInput>(key: K, value: TemplateInput[K]) => setForm((current) => ({ ...current, [key]: value }))
  const updateBlock = (updates: Partial<EmailBlock>) => setForm((current) => ({ ...current, blocks: current.blocks.map((block) => block.id === selectedBlockId ? { ...block, ...updates } : block) }))
  const addBlock = (definition: typeof blockTypes[number]) => {
    const block = newBlock(definition)
    setForm((current) => ({ ...current, blocks: [...current.blocks, block] }))
    setSelectedBlockId(block.id)
  }
  const moveBlock = (direction: -1 | 1) => {
    const index = form.blocks.findIndex((block) => block.id === selectedBlockId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= form.blocks.length) return
    const next = [...form.blocks]
    ;[next[index], next[target]] = [next[target], next[index]]
    setField("blocks", next)
  }
  const removeBlock = () => {
    const next = form.blocks.filter((block) => block.id !== selectedBlockId)
    setField("blocks", next)
    setSelectedBlockId(next[0]?.id || "")
  }
  const save = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!form.name.trim()) return toast.error("Template name is required.")
    if (!form.subject.trim()) return toast.error("Email subject is required.")
    try {
      const saved = id ? await updateTemplate(id, form) : await createTemplate(form)
      if (!saved) return toast.error("Template could not be saved.")
      toast.success(id ? "Template updated" : "Template created")
      const path = saved.type === "html" ? `/html-editor/${saved.id}` : saved.type === "simple" ? `/simple-editor/${saved.id}` : `/email-builder/${saved.id}`
      if (!id) void navigate({ to: getEmailMarketingPath(path) as never })
    } catch {
      toast.error("Template could not be saved.")
    }
  }

  return (
    <ModulePage>
      <PageContainer>
        <PageHeading title={editorTitle} description="Design reusable content with CRM styling and a recipient-safe email preview." actions={<><Button variant="outline" asChild><Link to={getEmailMarketingPath("/templates") as never}><ArrowLeft className="mr-2 h-4 w-4" />Templates</Link></Button><Button variant="outline" onClick={() => setPreview((current) => !current)}><Eye className="mr-2 h-4 w-4" />{preview ? "Edit" : "Preview"}</Button><Button onClick={() => save()}><Save className="mr-2 h-4 w-4" />Save template</Button></>} />

        <form onSubmit={save} className="grid gap-4 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2"><Label htmlFor="template-name">Template name</Label><Input id="template-name" value={form.name} onChange={(event) => setField("name", event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="template-subject">Subject</Label><Input id="template-subject" value={form.subject} onChange={(event) => setField("subject", event.target.value)} placeholder="Hello {{first_name}}" /></div>
          <div className="space-y-2"><Label htmlFor="template-preheader">Preheader</Label><Input id="template-preheader" value={form.preheader} onChange={(event) => setField("preheader", event.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2"><div className="space-y-2"><Label htmlFor="template-category">Category</Label><Input id="template-category" value={form.category} onChange={(event) => setField("category", event.target.value)} /></div><div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(value) => setField("status", value as TemplateStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div></div>
        </form>

        {preview ? (
          <div className="min-h-[680px] rounded-2xl border bg-muted/50 p-4 shadow-sm md:p-8"><iframe title="Email preview" srcDoc={previewHtml} sandbox="" className="mx-auto min-h-[620px] w-full max-w-3xl rounded-xl border-0 bg-white shadow-sm" /></div>
        ) : mode === "html" ? (
          <div className="grid min-h-[680px] overflow-hidden rounded-2xl border bg-card shadow-sm xl:grid-cols-2">
            <div className="border-b p-4 xl:border-b-0 xl:border-r"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Code2 className="h-4 w-4 text-primary" />HTML source</div><Textarea value={form.htmlContent} onChange={(event) => setField("htmlContent", event.target.value)} className="min-h-[600px] resize-none font-mono text-xs leading-5" spellCheck={false} /></div>
            <div className="bg-muted/40 p-4"><p className="mb-3 text-sm font-semibold">Live preview</p><iframe title="HTML preview" srcDoc={previewHtml} sandbox="" className="min-h-[600px] w-full rounded-xl border-0 bg-white shadow-sm" /></div>
          </div>
        ) : mode === "simple" ? (
          <div className="grid min-h-[640px] overflow-hidden rounded-2xl border bg-card shadow-sm xl:grid-cols-2">
            <div className="border-b p-5 xl:border-b-0 xl:border-r"><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setField("blocks", [...form.blocks, newBlock(blockTypes[0])])}><Heading1 className="mr-2 h-4 w-4" />Heading</Button><Button type="button" size="sm" variant="outline" onClick={() => setField("blocks", [...form.blocks, newBlock(blockTypes[1])])}><Type className="mr-2 h-4 w-4" />Paragraph</Button><Button type="button" size="sm" variant="outline" onClick={() => setField("blocks", [...form.blocks, newBlock(blockTypes[2])])}><Link2 className="mr-2 h-4 w-4" />Button</Button></div><div className="mt-5 space-y-4">{form.blocks.map((block, index) => <div key={block.id} className="rounded-xl border p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-medium capitalize">{block.type}</span><Button type="button" size="icon" variant="ghost" onClick={() => setField("blocks", form.blocks.filter((_, blockIndex) => blockIndex !== index))}><Trash2 className="h-4 w-4" /></Button></div><Textarea value={block.content} onChange={(event) => setField("blocks", form.blocks.map((item) => item.id === block.id ? { ...item, content: event.target.value } : item))} rows={block.type === "text" ? 6 : 2} />{block.type === "button" ? <Input value={block.href || ""} onChange={(event) => setField("blocks", form.blocks.map((item) => item.id === block.id ? { ...item, href: event.target.value } : item))} placeholder="Button URL" className="mt-2" /> : null}</div>)}</div></div>
            <div className="bg-muted/40 p-4"><p className="mb-3 text-sm font-semibold">Live preview</p><iframe title="Simple email preview" srcDoc={previewHtml} sandbox="" className="min-h-[580px] w-full rounded-xl border-0 bg-white shadow-sm" /></div>
          </div>
        ) : (
          <div className="grid min-h-[680px] overflow-hidden rounded-2xl border bg-card shadow-sm xl:grid-cols-[220px_minmax(360px,1fr)_280px]">
            <aside className="border-b p-4 xl:border-b-0 xl:border-r"><h3 className="text-sm font-semibold">Content blocks</h3><p className="mt-1 text-xs text-muted-foreground">Click to add a block.</p><div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-1">{blockTypes.map((definition) => { const Icon = definition.icon; return <button key={definition.type} type="button" onClick={() => addBlock(definition)} className="flex items-center gap-2 rounded-xl border bg-background p-3 text-left text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"><Icon className="h-4 w-4 text-primary" />{definition.label}<Plus className="ml-auto h-3.5 w-3.5 text-muted-foreground" /></button> })}</div></aside>
            <section className="bg-muted/40 p-4 md:p-6"><div className="mx-auto min-h-[620px] max-w-2xl rounded-xl bg-white p-6 text-slate-900 shadow-sm md:p-10">{form.blocks.length ? form.blocks.map((block) => <button key={block.id} type="button" onClick={() => setSelectedBlockId(block.id)} className={`relative block w-full rounded-lg border-2 p-2 text-left transition ${selectedBlockId === block.id ? "border-primary" : "border-transparent hover:border-primary/30"}`}><BlockPreview block={block} /></button>) : <button type="button" onClick={() => addBlock(blockTypes[0])} className="flex min-h-52 w-full items-center justify-center rounded-xl border border-dashed text-sm text-slate-500"><Plus className="mr-2 h-4 w-4" />Add your first block</button>}</div></section>
            <aside className="border-t p-4 xl:border-l xl:border-t-0"><h3 className="text-sm font-semibold">Block settings</h3>{selectedBlock ? <div className="mt-4 space-y-4"><div className="flex gap-1"><Button type="button" size="icon" variant={selectedBlock.align === "left" ? "default" : "outline"} onClick={() => updateBlock({ align: "left" })}><AlignLeft className="h-4 w-4" /></Button><Button type="button" size="icon" variant={selectedBlock.align === "center" ? "default" : "outline"} onClick={() => updateBlock({ align: "center" })}><AlignCenter className="h-4 w-4" /></Button><Button type="button" size="icon" variant={selectedBlock.align === "right" ? "default" : "outline"} onClick={() => updateBlock({ align: "right" })}><AlignRight className="h-4 w-4" /></Button><Button type="button" size="icon" variant="outline" onClick={() => moveBlock(-1)}><ArrowUp className="h-4 w-4" /></Button><Button type="button" size="icon" variant="outline" onClick={() => moveBlock(1)}><ArrowDown className="h-4 w-4" /></Button></div>{selectedBlock.type !== "divider" ? <div><Label htmlFor="block-content">{selectedBlock.type === "image" ? "Image URL" : selectedBlock.type === "spacer" ? "Height (px)" : "Content"}</Label><Textarea id="block-content" className="mt-2" rows={selectedBlock.type === "text" ? 6 : 3} value={selectedBlock.content} onChange={(event) => updateBlock({ content: event.target.value })} /></div> : null}{selectedBlock.type === "button" ? <div><Label htmlFor="block-link">Button URL</Label><Input id="block-link" className="mt-2" value={selectedBlock.href || ""} onChange={(event) => updateBlock({ href: event.target.value })} /></div> : null}<Button type="button" variant="destructive" className="w-full" onClick={removeBlock}><Trash2 className="mr-2 h-4 w-4" />Delete block</Button></div> : <p className="mt-4 text-xs leading-5 text-muted-foreground">Select a block in the canvas to edit it.</p>}</aside>
          </div>
        )}
      </PageContainer>
    </ModulePage>
  )
}

function BlockPreview({ block }: { block: EmailBlock }) {
  const style = { textAlign: block.align || "left" } as const
  if (block.type === "heading") return <h1 style={style} className="m-0 text-3xl font-bold">{block.content}</h1>
  if (block.type === "text") return <p style={style} className="m-0 whitespace-pre-wrap leading-7 text-slate-600">{block.content}</p>
  if (block.type === "button") return <div style={style}><span className="inline-flex rounded-lg bg-amber-700 px-5 py-3 font-semibold text-white">{block.content}</span></div>
  if (block.type === "image") return <div style={style}><img src={block.content} alt="" className="inline-block max-h-72 max-w-full rounded-xl object-cover" /></div>
  if (block.type === "divider") return <Minus className="h-px w-full bg-slate-200 text-transparent" />
  return <div style={{ height: `${Math.max(8, Number(block.content) || 32)}px` }} className="rounded border border-dashed border-slate-200" />
}
