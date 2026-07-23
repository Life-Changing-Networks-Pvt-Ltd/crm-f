import { useEffect, useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import {
  ArrowLeft,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  emailMarketingNavigation,
  getEmailMarketingModulePath,
  getEmailMarketingPath,
  getEmailMarketingRequiredPermission,
} from "./navigation"
import { useEmailMarketingStore } from "./EmailMarketingStore"

interface EmailMarketingSidebarProps {
  pathname: string
  collapsed: boolean
  mobileOpen: boolean
  onCollapsedChange: (collapsed: boolean) => void
  onMobileOpenChange: (open: boolean) => void
}

export function EmailMarketingSidebar({
  pathname,
  collapsed,
  mobileOpen,
  onCollapsedChange,
  onMobileOpenChange,
}: EmailMarketingSidebarProps) {
  const modulePath = getEmailMarketingModulePath(pathname)
  const { permissions } = useEmailMarketingStore()
  const visibleNavigation = useMemo(() => {
    const granted = new Set(permissions)
    return emailMarketingNavigation
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          granted.has(getEmailMarketingRequiredPermission(item.path)),
        ),
      }))
      .filter((group) => group.items.length)
  }, [permissions])
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const activeParent = visibleNavigation
      .flatMap((group) => group.items)
      .find((item) => item.children && modulePath.startsWith(item.path))

    if (activeParent) {
      setOpenItems((current) => ({ ...current, [activeParent.path]: true }))
    }
  }, [modulePath, visibleNavigation])

  const closeMobile = () => onMobileOpenChange(false)
  const setDesktopCollapsed = (next: boolean) => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      onCollapsedChange(next)
    }
  }
  const isActive = (path: string) =>
    modulePath === path || (path !== "/overview" && modulePath.startsWith(`${path}/`))

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close Email Marketing navigation"
          className="fixed inset-0 z-40 bg-foreground/25 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full min-h-0 w-[min(88vw,19rem)] flex-col border-r bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:w-[4.75rem]" : "lg:w-[19rem]",
        )}
        onMouseEnter={() => setDesktopCollapsed(false)}
        onMouseLeave={() => setDesktopCollapsed(true)}
      >
        <div className={cn(
          "flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-3",
          collapsed && "lg:justify-center",
        )}>
          <Link
            to="/"
            onClick={closeMobile}
            className={cn(
              "flex h-11 min-w-0 items-center border border-primary/20 bg-primary/5 text-primary transition hover:border-primary/35 hover:bg-primary/10",
              collapsed ? "w-11 shrink-0 justify-center rounded-xl px-0" : "flex-1 gap-3 rounded-lg px-4",
            )}
            aria-label="Back to CRM dashboard"
            title="Back to CRM dashboard"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {!collapsed ? <span className="truncate text-sm font-medium">Back Dashboard</span> : null}
          </Link>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
            onClick={closeMobile}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-5">
            {visibleNavigation.map((group) => (
              <section key={group.label}>
                {!collapsed ? (
                  <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {group.label}
                  </p>
                ) : null}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.path)
                    const hasChildren = Boolean(item.children?.length)
                    const open = Boolean(openItems[item.path])

                    return (
                      <div key={item.path}>
                        {hasChildren ? (
                          <button
                            type="button"
                            aria-expanded={open}
                            aria-controls={`email-marketing-submenu-${item.path.replaceAll("/", "-")}`}
                            onClick={() =>
                              setOpenItems((current) => ({
                                ...current,
                                [item.path]: !current[item.path],
                              }))
                            }
                            title={collapsed ? item.label : undefined}
                            className={cn(
                              "flex h-11 w-full min-w-0 items-center rounded-xl text-sm font-medium transition",
                              collapsed ? "justify-center px-0" : "gap-3 px-3",
                              active
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {!collapsed ? <span className="truncate">{item.label}</span> : null}
                          </button>
                        ) : (
                          <Link
                            to={getEmailMarketingPath(item.path) as never}
                            onClick={closeMobile}
                            title={collapsed ? item.label : undefined}
                            className={cn(
                              "flex h-11 min-w-0 items-center rounded-xl text-sm font-medium transition",
                              collapsed ? "justify-center px-0" : "gap-3 px-3",
                              active
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {!collapsed ? <span className="truncate">{item.label}</span> : null}
                          </Link>
                        )}

                        {hasChildren && open && !collapsed ? (
                          <div id={`email-marketing-submenu-${item.path.replaceAll("/", "-")}`} className="ml-5 mt-1 space-y-1 border-l border-sidebar-border pl-4">
                            {item.children?.map((child) => (
                              <Link
                                key={child.path}
                                to={getEmailMarketingPath(child.path) as never}
                                onClick={closeMobile}
                                className={cn(
                                  "block rounded-lg px-3 py-2 text-xs font-medium transition",
                                  modulePath === child.path
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                )}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

      </aside>
    </>
  )
}
