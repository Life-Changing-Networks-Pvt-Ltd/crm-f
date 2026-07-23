/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react"
import { Inbox, Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function ModulePage({ children }: { children: ReactNode }) {
  return <main className="min-h-0 flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">{children}</main>
}

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto flex w-full max-w-[1600px] flex-col gap-6", className)}>{children}</div>
}

export function PageHeading({
  eyebrow = "Email Marketing",
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  helper,
  icon,
  tone = "primary",
}: {
  label: string
  value: string | number
  helper: string
  icon: ReactNode
  tone?: "primary" | "success" | "warning" | "muted"
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    muted: "bg-muted text-muted-foreground",
  }[tone]

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneClass)}>{icon}</div>
      </div>
      <p className="mt-6 text-3xl font-bold tracking-tight text-card-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

export function SearchField({ value, onChange, placeholder = "Search...", className }: { value: string; onChange: (value: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  )
}

export function EmptyPanel({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed bg-card p-8 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Inbox className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-card-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </div>
  )
}

export function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const style = normalized === "active" || normalized === "subscribed"
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    : normalized === "draft"
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
      : normalized === "suppressed" || normalized === "blocked"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground"
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize", style)}>{status.replace("_", " ")}</span>
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value))
}
