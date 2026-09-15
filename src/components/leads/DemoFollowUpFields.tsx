import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const localDemoFollowUpDateTime = (value?: string) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function DemoFollowUpFields({ value, onChange, reminder, onReminderChange, note, onNoteChange, disabled = false }: {
  value: string
  onChange: (value: string) => void
  reminder: string
  onReminderChange: (value: string) => void
  note?: string
  onNoteChange?: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div className="col-span-full space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          <span>Demo Follow-up Date &amp; Time</span>
          <Input aria-label="Demo Follow-up Date & Time" type="datetime-local" value={value} required disabled={disabled} onChange={(event) => onChange(event.target.value)} />
        </label>
        <div className="space-y-2 text-sm font-medium">
          <span>Reminder</span>
          <Select value={reminder} disabled={disabled} onValueChange={onReminderChange}>
            <SelectTrigger aria-label="Demo Follow-up Reminder"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="15_minutes">15 minutes before</SelectItem>
              <SelectItem value="30_minutes">30 minutes before</SelectItem>
              <SelectItem value="1_hour">1 hour before</SelectItem>
              <SelectItem value="1_day">1 day before</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {onNoteChange && <label className="block space-y-2 text-sm font-medium"><span>Demo follow-up Note</span><Textarea value={note || ""} onChange={(event) => onNoteChange(event.target.value)} disabled={disabled} placeholder="Add relevant details..." /></label>}
    </div>
  )
}
