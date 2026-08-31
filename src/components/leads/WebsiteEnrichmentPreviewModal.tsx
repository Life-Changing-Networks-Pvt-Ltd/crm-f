import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export type ConfidenceLevel = "high" | "medium" | "low"
export type WebsiteEnrichmentField =
  | "companyName"
  | "primaryPerson"
  | "primaryEmail"
  | "secondaryEmail"
  | "primaryPhone"
  | "alternatePhone"
  | "city"
  | "address"
  | "description"
  | "businessType"

export interface WebsiteEnrichmentData {
  companyName: string
  primaryPerson: string
  primaryEmail: string
  secondaryEmail: string
  primaryPhone: string
  alternatePhone: string
  city: string
  address: string
  description: string
  businessType: string
  confidence: Record<WebsiteEnrichmentField, ConfidenceLevel>
}

export type WebsitePreviewField = WebsiteEnrichmentField | "websiteUrl"

interface WebsiteEnrichmentPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: WebsiteEnrichmentData | null
  websiteUrl: string
  source: "cache" | "website" | null
  onApply: (selectedFields: WebsitePreviewField[]) => void
}

const FIELD_ROWS: Array<{ key: WebsitePreviewField; label: string }> = [
  { key: "websiteUrl", label: "Primary Website" },
  { key: "companyName", label: "Company Name" },
  { key: "primaryPerson", label: "Primary Contact Name" },
  { key: "primaryEmail", label: "Primary Email" },
  { key: "secondaryEmail", label: "Secondary Email" },
  { key: "primaryPhone", label: "Mobile Number" },
  { key: "alternatePhone", label: "Alternate Phone" },
  { key: "address", label: "Address Line 1" },
  { key: "city", label: "City" },
  { key: "businessType", label: "Business Type" },
  { key: "description", label: "Core Products/Services" },
]

const confidenceClass: Record<ConfidenceLevel, string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-slate-200 bg-slate-50 text-slate-600",
}

export function WebsiteEnrichmentPreviewModal({
  open,
  onOpenChange,
  data,
  websiteUrl,
  source,
  onApply,
}: WebsiteEnrichmentPreviewModalProps) {
  const [selectedFields, setSelectedFields] = useState<WebsitePreviewField[]>([])

  useEffect(() => {
    if (!open || !data) return
    setSelectedFields(FIELD_ROWS
      .filter(({ key }) => key === "websiteUrl" ? Boolean(websiteUrl) : Boolean(data[key]))
      .map(({ key }) => key))
  }, [data, open, websiteUrl])

  const valueFor = (field: WebsitePreviewField) => field === "websiteUrl"
    ? websiteUrl
    : data?.[field] || ""
  const confidenceFor = (field: WebsitePreviewField): ConfidenceLevel => field === "websiteUrl"
    ? "high"
    : data?.confidence[field] || "low"
  const toggleField = (field: WebsitePreviewField, checked: boolean) => {
    setSelectedFields((current) => checked
      ? Array.from(new Set([...current, field]))
      : current.filter((item) => item !== field))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Extracted Data Preview</DialogTitle>
          <DialogDescription>
            Select the website details you want to apply to this company lead.
            {source === "cache" ? " This result was loaded from the 15-day cache." : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="divide-y rounded-lg border">
          {FIELD_ROWS.map(({ key, label }) => {
            const value = valueFor(key)
            const confidence = confidenceFor(key)
            const disabled = !value
            return (
              <div key={key} className="flex items-start gap-3 p-3">
                <Checkbox
                  id={`website-field-${key}`}
                  checked={selectedFields.includes(key)}
                  disabled={disabled}
                  onCheckedChange={(checked) => toggleField(key, checked === true)}
                  className="mt-1"
                />
                <Label htmlFor={`website-field-${key}`} className="min-w-0 flex-1 cursor-pointer space-y-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-medium">{label}</span>
                    <Badge variant="outline" className={confidenceClass[confidence]}>
                      {confidence.charAt(0).toUpperCase() + confidence.slice(1)} confidence
                    </Badge>
                  </span>
                  <span className={`block break-words text-sm font-normal ${disabled ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                    {value || "Not found"}
                  </span>
                </Label>
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            type="button"
            disabled={!selectedFields.length}
            onClick={() => onApply(selectedFields)}
          >
            Apply to Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
