import { Menu } from "lucide-react"
import { useSelector } from "react-redux"

import { ThemeToggle } from "@/components/layout/ThemeToggle"
import type { RootState } from "@/store"
import { getEmailMarketingPageMeta } from "./navigation"

interface EmailMarketingTopbarProps {
  pathname: string
  onOpenNavigation: () => void
}

export function EmailMarketingTopbar({ pathname, onOpenNavigation }: EmailMarketingTopbarProps) {
  const user = useSelector((state: RootState) => state.auth.user)
  const page = getEmailMarketingPageMeta(pathname)

  return (
    <header className="sticky top-0 z-30 flex min-h-16 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      <button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-card text-card-foreground transition hover:bg-accent lg:hidden"
        onClick={onOpenNavigation}
        aria-label="Open Email Marketing navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1 py-2">
        <h1 className="truncate text-base font-semibold tracking-tight text-foreground md:text-lg">
          {page.path === "/overview" ? "Email Marketing" : page.label}
        </h1>
        {page.path !== "/overview" ? (
          <p className="hidden truncate text-xs text-muted-foreground sm:block">{page.description}</p>
        ) : null}
      </div>

      <ThemeToggle />

      <div className="flex min-w-0 items-center gap-2 border-l pl-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
        </div>
        <div className="hidden min-w-0 sm:block">
          <p className="max-w-36 truncate text-xs font-medium text-foreground">{user?.name || "CRM User"}</p>
          <p className="max-w-36 truncate text-[11px] text-muted-foreground">{user?.email || "Email Marketing"}</p>
        </div>
      </div>
    </header>
  )
}
