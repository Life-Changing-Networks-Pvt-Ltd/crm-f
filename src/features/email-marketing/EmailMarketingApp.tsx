import { useEffect, useState } from "react"
import { useLocation } from "@tanstack/react-router"

import { EmailMarketingContent } from "./EmailMarketingContent"
import { EmailMarketingErrorBoundary } from "./EmailMarketingErrorBoundary"
import { EmailMarketingSidebar } from "./EmailMarketingSidebar"
import { EmailMarketingStoreProvider } from "./EmailMarketingStore"
import { EmailMarketingTopbar } from "./EmailMarketingTopbar"

export default function EmailMarketingApp() {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
  )
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)")
    const syncSidebarMode = () => setSidebarCollapsed(desktop.matches)
    desktop.addEventListener("change", syncSidebarMode)
    return () => desktop.removeEventListener("change", syncSidebarMode)
  }, [])

  return (
    <EmailMarketingErrorBoundary>
      <EmailMarketingStoreProvider>
        <div className="fixed inset-0 flex h-[100dvh] min-h-0 w-full overflow-hidden bg-background text-foreground">
          <EmailMarketingSidebar
            pathname={location.pathname}
            collapsed={sidebarCollapsed}
            mobileOpen={mobileNavigationOpen}
            onCollapsedChange={setSidebarCollapsed}
            onMobileOpenChange={setMobileNavigationOpen}
          />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <EmailMarketingTopbar
              pathname={location.pathname}
              onOpenNavigation={() => setMobileNavigationOpen(true)}
            />
            <EmailMarketingContent pathname={location.pathname} />
          </div>
        </div>
      </EmailMarketingStoreProvider>
    </EmailMarketingErrorBoundary>
  )
}
