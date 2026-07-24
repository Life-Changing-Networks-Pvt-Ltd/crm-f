import { useMemo, useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowLeft, ArrowUp, Braces, Code2, Eye, Film, Heading1, Image, Link2, Loader2, Minus, MousePointerClick, Navigation, Plus, Save, SeparatorHorizontal, Share2, ShoppingBag, Space, Trash2, Type, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useEmailMarketingStore } from "../EmailMarketingStore"
import { getEmailMarketingErrorMessage, uploadEmailMarketingImage } from "../emailMarketingApi"
import { ModulePage, PageContainer, PageHeading } from "../components/PageElements"
import { getEmailMarketingPath } from "../navigation"
import type { EmailBlock, TemplateInput, TemplateType } from "../types"
import { templateToHtml } from "./templateUtils"

type BlockDefinition = {
  type: EmailBlock["type"]
  label: string
  description: string
  icon: typeof Heading1
  defaults: Omit<Partial<EmailBlock>, "id" | "type"> & Pick<EmailBlock, "content">
}

const blockTypes: BlockDefinition[] = [
  { type: "heading", label: "Title", description: "Primary headline for the email.", icon: Heading1, defaults: { content: "Your headline" } },
  { type: "text", label: "Body text", description: "Editable paragraph copy for your email.", icon: Type, defaults: { content: "Write your message here." } },
  { type: "image", label: "Image", description: "Hero, product, or banner image.", icon: Image, defaults: { content: "", alt: "" } },
  { type: "video", label: "Video", description: "Video thumbnail with a linked play CTA.", icon: Film, defaults: { content: "", href: "https://example.com/video", alt: "Watch video" } },
  { type: "button", label: "Button", description: "Clear CTA with a destination link.", icon: MousePointerClick, defaults: { content: "Learn more", href: "https://example.com" } },
  { type: "dynamic", label: "Dynamic content", description: "Personalized subscriber information.", icon: Braces, defaults: { content: "{{first_name}}" } },
  { type: "logo", label: "Logo", description: "Brand logo with an optional link.", icon: Image, defaults: { content: "", href: "", alt: "Logo", align: "center" } },
  { type: "social", label: "Social", description: "Social links for your brand profiles.", icon: Share2, defaults: { content: "", align: "center", items: [{ label: "Facebook", url: "https://facebook.com" }, { label: "Instagram", url: "https://instagram.com" }] } },
  { type: "html", label: "HTML", description: "Raw HTML block with preview rendering.", icon: Code2, defaults: { content: "<p style=\"color:#4b5563\">Custom HTML content</p>" } },
  { type: "divider", label: "Divider", description: "Visual separator between sections.", icon: SeparatorHorizontal, defaults: { content: "" } },
  { type: "product", label: "Product", description: "Product card with image and CTA.", icon: ShoppingBag, defaults: { content: "Product name", subtitle: "Describe the product and its key benefit.", price: "₹999", imageUrl: "", href: "https://example.com/product", buttonText: "View product" } },
  { type: "navigation", label: "Navigation", description: "Editable menu links and alignment.", icon: Navigation, defaults: { content: "", align: "center", items: [{ label: "Home", url: "https://example.com" }, { label: "Shop", url: "https://example.com/shop" }] } },
  { type: "spacer", label: "Spacer", description: "Clean vertical breathing room.", icon: Space, defaults: { content: "32" } },
]

function newBlock(definition: BlockDefinition): EmailBlock {
  return {
    id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: definition.type,
    align: "left",
    ...definition.defaults,
  }
}

function initialTemplate(type: TemplateType): TemplateInput {
  return {
    name: "",
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
  const [uploadingImage, setUploadingImage] = useState(false)
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
  const updateBlockItem = (index: number, updates: Partial<{ label: string; url: string }>) => {
    if (!selectedBlock) return
    updateBlock({
      items: (selectedBlock.items || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item,
      ),
    })
  }
  const addBlockItem = () => {
    if (!selectedBlock || (selectedBlock.items?.length || 0) >= 12) return
    updateBlock({
      items: [...(selectedBlock.items || []), { label: "New link", url: "https://example.com" }],
    })
  }
  const removeBlockItem = (index: number) => {
    if (!selectedBlock) return
    updateBlock({ items: (selectedBlock.items || []).filter((_, itemIndex) => itemIndex !== index) })
  }
  const uploadBlockImage = async (file: File, field: "content" | "imageUrl" = "content") => {
    if (!["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.type)) {
      return toast.error("Choose a PNG, JPEG, GIF, or WebP image.")
    }
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be 5 MB or smaller.")
    const targetBlockId = selectedBlockId
    setUploadingImage(true)
    try {
      const asset = await uploadEmailMarketingImage(file)
      setForm((current) => ({
        ...current,
        blocks: current.blocks.map((block) =>
          block.id === targetBlockId ? { ...block, [field]: asset.url } : block,
        ),
      }))
      toast.success("Image uploaded")
    } catch (error) {
      toast.error(getEmailMarketingErrorMessage(error, "Image could not be uploaded."))
    } finally {
      setUploadingImage(false)
    }
  }
  const save = async () => {
    if (form.name.trim().length < 2) return toast.error("Enter a template name with at least 2 characters.")
    try {
      const saved = id ? await updateTemplate(id, form) : await createTemplate(form)
      if (!saved) return toast.error("Template could not be saved.")
      toast.success(id ? "Template updated" : "Template created")
      void navigate({ to: getEmailMarketingPath("/templates") as never })
    } catch {
      toast.error("Template could not be saved.")
    }
  }

  return (
    <ModulePage>
      <PageContainer>
        <PageHeading title={editorTitle} description="Design reusable content with CRM styling and a recipient-safe email preview." actions={<><Button variant="outline" asChild><Link to={getEmailMarketingPath("/templates") as never}><ArrowLeft className="mr-2 h-4 w-4" />Templates</Link></Button><Input aria-label="Template name" placeholder="Template Name" value={form.name} onChange={(event) => setField("name", event.target.value)} maxLength={120} className="w-full sm:w-56" /><Button variant="outline" onClick={() => setPreview((current) => !current)}><Eye className="mr-2 h-4 w-4" />{preview ? "Edit" : "Preview"}</Button><Button onClick={() => save()} disabled={form.name.trim().length < 2 || uploadingImage}><Save className="mr-2 h-4 w-4" />Save template</Button></>} />

        {preview ? (
          <div className="min-h-[680px] rounded-2xl border bg-muted/50 p-4 shadow-sm md:p-8"><iframe title="Email preview" srcDoc={previewHtml} sandbox="" className="mx-auto min-h-[620px] w-full max-w-3xl rounded-xl border-0 bg-white shadow-sm" /></div>
        ) : mode === "html" ? (
          <div className="grid min-h-[680px] overflow-hidden rounded-2xl border bg-card shadow-sm xl:grid-cols-2">
            <div className="border-b p-4 xl:border-b-0 xl:border-r"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Code2 className="h-4 w-4 text-primary" />HTML source</div><Textarea value={form.htmlContent} onChange={(event) => setField("htmlContent", event.target.value)} className="min-h-[600px] resize-none font-mono text-xs leading-5" spellCheck={false} /></div>
            <div className="bg-muted/40 p-4"><p className="mb-3 text-sm font-semibold">Live preview</p><iframe title="HTML preview" srcDoc={previewHtml} sandbox="" className="min-h-[600px] w-full rounded-xl border-0 bg-white shadow-sm" /></div>
          </div>
        ) : mode === "simple" ? (
          <div className="grid min-h-[640px] overflow-hidden rounded-2xl border bg-card shadow-sm xl:grid-cols-2">
            <div className="border-b p-5 xl:border-b-0 xl:border-r"><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setField("blocks", [...form.blocks, newBlock(blockTypes[0])])}><Heading1 className="mr-2 h-4 w-4" />Heading</Button><Button type="button" size="sm" variant="outline" onClick={() => setField("blocks", [...form.blocks, newBlock(blockTypes[1])])}><Type className="mr-2 h-4 w-4" />Paragraph</Button><Button type="button" size="sm" variant="outline" onClick={() => setField("blocks", [...form.blocks, newBlock(blockTypes[4])])}><Link2 className="mr-2 h-4 w-4" />Button</Button></div><div className="mt-5 space-y-4">{form.blocks.map((block, index) => <div key={block.id} className="rounded-xl border p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-medium capitalize">{block.type}</span><Button type="button" size="icon" variant="ghost" onClick={() => setField("blocks", form.blocks.filter((_, blockIndex) => blockIndex !== index))}><Trash2 className="h-4 w-4" /></Button></div><Textarea value={block.content} onChange={(event) => setField("blocks", form.blocks.map((item) => item.id === block.id ? { ...item, content: event.target.value } : item))} rows={block.type === "text" ? 6 : 2} />{block.type === "button" ? <Input value={block.href || ""} onChange={(event) => setField("blocks", form.blocks.map((item) => item.id === block.id ? { ...item, href: event.target.value } : item))} placeholder="Button URL" className="mt-2" /> : null}</div>)}</div></div>
            <div className="bg-muted/40 p-4"><p className="mb-3 text-sm font-semibold">Live preview</p><iframe title="Simple email preview" srcDoc={previewHtml} sandbox="" className="min-h-[580px] w-full rounded-xl border-0 bg-white shadow-sm" /></div>
          </div>
        ) : (
          <div className="grid min-h-[680px] overflow-hidden rounded-2xl border bg-card shadow-sm xl:grid-cols-[300px_minmax(360px,1fr)_320px]">
            <aside className="border-b p-4 xl:border-b-0 xl:border-r">
              <h3 className="text-sm font-semibold">Content blocks</h3>
              <p className="mt-1 text-xs text-muted-foreground">Click a block to add it to the canvas.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {blockTypes.map((definition) => {
                  const Icon = definition.icon
                  return (
                    <button key={definition.type} type="button" onClick={() => addBlock(definition)} className="group rounded-xl border bg-background p-3 text-left transition hover:border-primary/40 hover:bg-primary/5">
                      <span className="flex items-center gap-2 text-xs font-semibold"><Icon className="h-4 w-4 text-primary" />{definition.label}<Plus className="ml-auto h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" /></span>
                      <span className="mt-1.5 block text-[10px] leading-4 text-muted-foreground">{definition.description}</span>
                    </button>
                  )
                })}
              </div>
            </aside>
            <section className="bg-muted/40 p-4 md:p-6" onClick={() => setSelectedBlockId("")}><div className="mx-auto min-h-[620px] max-w-2xl rounded-xl bg-white p-6 text-slate-900 shadow-sm md:p-10">{form.blocks.length ? form.blocks.map((block) => <div key={block.id} role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); setSelectedBlockId(block.id) }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedBlockId(block.id) }} className={`relative block w-full cursor-pointer rounded-lg border-2 p-2 text-left transition ${selectedBlockId === block.id ? "border-primary" : "border-transparent hover:border-primary/30"}`}><BlockPreview block={block} /></div>) : <button type="button" onClick={(event) => { event.stopPropagation(); addBlock(blockTypes[0]) }} className="flex min-h-52 w-full items-center justify-center rounded-xl border border-dashed text-sm text-slate-500"><Plus className="mr-2 h-4 w-4" />Add your first block</button>}</div></section>
            <aside className="border-t p-4 xl:border-l xl:border-t-0">
              <h3 className="text-sm font-semibold">Block settings</h3>
              {selectedBlock ? (
                <div className="mt-4 space-y-4">
                  <div className="flex gap-1">
                    <Button type="button" size="icon" variant={selectedBlock.align === "left" ? "default" : "outline"} onClick={() => updateBlock({ align: "left" })} title="Align left"><AlignLeft className="h-4 w-4" /></Button>
                    <Button type="button" size="icon" variant={selectedBlock.align === "center" ? "default" : "outline"} onClick={() => updateBlock({ align: "center" })} title="Align center"><AlignCenter className="h-4 w-4" /></Button>
                    <Button type="button" size="icon" variant={selectedBlock.align === "right" ? "default" : "outline"} onClick={() => updateBlock({ align: "right" })} title="Align right"><AlignRight className="h-4 w-4" /></Button>
                    <Button type="button" size="icon" variant="outline" onClick={() => moveBlock(-1)} title="Move up"><ArrowUp className="h-4 w-4" /></Button>
                    <Button type="button" size="icon" variant="outline" onClick={() => moveBlock(1)} title="Move down"><ArrowDown className="h-4 w-4" /></Button>
                  </div>

                  {["heading", "text", "button", "dynamic", "html", "spacer"].includes(selectedBlock.type) ? (
                    <div>
                      <Label htmlFor="block-content">{selectedBlock.type === "spacer" ? "Height (px)" : selectedBlock.type === "html" ? "HTML source" : "Content"}</Label>
                      <Textarea id="block-content" className={`mt-2 ${selectedBlock.type === "html" ? "font-mono text-xs" : ""}`} rows={["text", "html"].includes(selectedBlock.type) ? 7 : 3} value={selectedBlock.content} onChange={(event) => updateBlock({ content: event.target.value })} />
                      {selectedBlock.type === "dynamic" ? <p className="mt-2 text-xs text-muted-foreground">Supported: {"{{first_name}}"}, {"{{last_name}}"}, {"{{email}}"}, {"{{phone}}"}</p> : null}
                    </div>
                  ) : null}

                  {["image", "video", "logo"].includes(selectedBlock.type) ? (
                    <ImageSettings block={selectedBlock} uploading={uploadingImage} onUpdate={updateBlock} onUpload={(file) => uploadBlockImage(file)} />
                  ) : null}

                  {["button", "video", "logo"].includes(selectedBlock.type) ? (
                    <div><Label htmlFor="block-link">Destination URL</Label><Input id="block-link" className="mt-2" value={selectedBlock.href || ""} onChange={(event) => updateBlock({ href: event.target.value })} placeholder="https://example.com" /></div>
                  ) : null}

                  {selectedBlock.type === "product" ? (
                    <div className="space-y-4">
                      <div><Label htmlFor="product-name">Product name</Label><Input id="product-name" className="mt-2" value={selectedBlock.content} onChange={(event) => updateBlock({ content: event.target.value })} /></div>
                      <div><Label htmlFor="product-description">Description</Label><Textarea id="product-description" className="mt-2" rows={4} value={selectedBlock.subtitle || ""} onChange={(event) => updateBlock({ subtitle: event.target.value })} /></div>
                      <div><Label htmlFor="product-price">Price</Label><Input id="product-price" className="mt-2" value={selectedBlock.price || ""} onChange={(event) => updateBlock({ price: event.target.value })} /></div>
                      <ImageSettings
                        block={{ ...selectedBlock, content: selectedBlock.imageUrl || "" }}
                        uploading={uploadingImage}
                        onUpdate={(updates) => updateBlock({
                          ...("content" in updates ? { imageUrl: updates.content } : {}),
                          ...("alt" in updates ? { alt: updates.alt } : {}),
                        })}
                        onUpload={(file) => uploadBlockImage(file, "imageUrl")}
                        label="Product image"
                      />
                      <div><Label htmlFor="product-link">Product URL</Label><Input id="product-link" className="mt-2" value={selectedBlock.href || ""} onChange={(event) => updateBlock({ href: event.target.value })} /></div>
                      <div><Label htmlFor="product-button">Button text</Label><Input id="product-button" className="mt-2" value={selectedBlock.buttonText || ""} onChange={(event) => updateBlock({ buttonText: event.target.value })} /></div>
                    </div>
                  ) : null}

                  {["social", "navigation"].includes(selectedBlock.type) ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between"><Label>Links</Label><Button type="button" size="sm" variant="outline" onClick={addBlockItem} disabled={(selectedBlock.items?.length || 0) >= 12}><Plus className="mr-1 h-3.5 w-3.5" />Add</Button></div>
                      {(selectedBlock.items || []).map((item, index) => (
                        <div key={`${selectedBlock.id}-item-${index}`} className="rounded-xl border p-3">
                          <div className="flex gap-2"><Input aria-label={`Link ${index + 1} label`} value={item.label} onChange={(event) => updateBlockItem(index, { label: event.target.value })} placeholder="Label" /><Button type="button" size="icon" variant="ghost" onClick={() => removeBlockItem(index)} title="Remove link"><Trash2 className="h-4 w-4" /></Button></div>
                          <Input aria-label={`Link ${index + 1} URL`} className="mt-2" value={item.url} onChange={(event) => updateBlockItem(index, { url: event.target.value })} placeholder="https://example.com" />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <Button type="button" variant="destructive" className="w-full" onClick={removeBlock}><Trash2 className="mr-2 h-4 w-4" />Delete block</Button>
                </div>
              ) : <p className="mt-4 text-xs leading-5 text-muted-foreground">Select a block in the canvas to edit it.</p>}
            </aside>
          </div>
        )}
      </PageContainer>
    </ModulePage>
  )
}

function ImageSettings({
  block,
  uploading,
  onUpdate,
  onUpload,
  label = "Image",
}: {
  block: EmailBlock
  uploading: boolean
  onUpdate: (updates: Partial<EmailBlock>) => void
  onUpload: (file: File) => void
  label?: string
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`block-image-${block.id}`}>{label} URL</Label>
        <Input id={`block-image-${block.id}`} className="mt-2" value={block.content} onChange={(event) => onUpdate({ content: event.target.value })} placeholder="https://example.com/image.jpg" />
      </div>
      <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed px-3 py-3 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-primary">
        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        {uploading ? "Uploading…" : "Upload from computer"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onUpload(file)
            event.target.value = ""
          }}
        />
      </label>
      <p className="text-[11px] leading-4 text-muted-foreground">PNG, JPEG, GIF, or WebP. Maximum 5 MB.</p>
      <div>
        <Label htmlFor={`block-alt-${block.id}`}>Alt text</Label>
        <Input id={`block-alt-${block.id}`} className="mt-2" value={block.alt || ""} onChange={(event) => onUpdate({ alt: event.target.value })} placeholder="Describe this image" />
      </div>
    </div>
  )
}

function BlockPreview({ block }: { block: EmailBlock }) {
  const style = { textAlign: block.align || "left" } as const
  if (block.type === "heading") return <h1 style={style} className="m-0 text-3xl font-bold">{block.content}</h1>
  if (block.type === "text") return <p style={style} className="m-0 whitespace-pre-wrap leading-7 text-slate-600">{block.content}</p>
  if (block.type === "button") return <div style={style}><span className="inline-flex rounded-lg bg-amber-700 px-5 py-3 font-semibold text-white">{block.content}</span></div>
  if (block.type === "image") return <div style={style}>{block.content ? <img src={block.content} alt={block.alt || ""} className="inline-block max-h-72 max-w-full rounded-xl object-cover" /> : <span className="inline-flex min-h-32 w-full items-center justify-center rounded-xl border border-dashed text-sm text-slate-400"><Image className="mr-2 h-5 w-5" />Add an image</span>}</div>
  if (block.type === "video") return <div style={style} className="relative">{block.content ? <img src={block.content} alt={block.alt || "Watch video"} className="inline-block max-h-72 max-w-full rounded-xl object-cover" /> : <div className="min-h-36 rounded-xl bg-slate-100" />}<span className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full bg-amber-700 px-4 py-3 font-semibold text-white"><Film className="mr-2 h-4 w-4" />Watch video</span></div>
  if (block.type === "dynamic") return <p style={style} className="m-0 rounded-lg bg-amber-50 p-3 leading-7 text-slate-600"><Braces className="mr-2 inline h-4 w-4 text-amber-700" />{block.content || "{{first_name}}"}</p>
  if (block.type === "logo") return <div style={style}>{block.content ? <img src={block.content} alt={block.alt || "Logo"} className="inline-block max-h-24 max-w-[220px] object-contain" /> : <span className="inline-flex h-20 w-40 items-center justify-center rounded-lg border border-dashed text-sm text-slate-400">Add your logo</span>}</div>
  if (block.type === "social") return <div style={style}>{(block.items || []).map((item, index) => <span key={`${item.label}-${index}`} className="mx-2 inline-block font-semibold text-amber-700">{item.label}</span>)}</div>
  if (block.type === "html") return <iframe title="HTML block preview" srcDoc={block.content} sandbox="" className="pointer-events-none min-h-32 w-full rounded-lg border bg-white" />
  if (block.type === "divider") return <Minus className="h-px w-full bg-slate-200 text-transparent" />
  if (block.type === "product") return <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-[140px_1fr]">{block.imageUrl ? <img src={block.imageUrl} alt={block.alt || block.content} className="h-32 w-full rounded-lg object-cover" /> : <div className="flex h-32 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><ShoppingBag className="h-7 w-7" /></div>}<div><h2 className="text-xl font-bold">{block.content}</h2><p className="mt-1 text-sm text-slate-500">{block.subtitle}</p>{block.price ? <p className="mt-2 font-bold">{block.price}</p> : null}<span className="mt-3 inline-flex rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white">{block.buttonText || "View product"}</span></div></div>
  if (block.type === "navigation") return <nav style={style}>{(block.items || []).map((item, index) => <span key={`${item.label}-${index}`} className="mx-3 inline-block font-semibold text-slate-700">{item.label}</span>)}</nav>
  return <div style={{ height: `${Math.min(500, Math.max(8, Number(block.content) || 32))}px` }} className="rounded border border-dashed border-slate-200" />
}
