import { lazy, Suspense, useEffect, useState } from "react"
import { Outlet } from "@tanstack/react-router"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { AppNavbar } from "./AppNavbar"

const GlobalStickyNotes = lazy(() => import("../shared/GlobalStickyNotes").then((module) => ({
  default: module.GlobalStickyNotes,
})))
const BrowserCallDialog = lazy(() => import("../shared/BrowserCallDialog").then((module) => ({
  default: module.BrowserCallDialog,
})))
const FollowUpReminderCenter = lazy(() => import("../shared/FollowUpReminderCenter").then((module) => ({
  default: module.FollowUpReminderCenter,
})))

export function AppShell() {
  const [loadUtilities, setLoadUtilities] = useState(false)

  useEffect(() => {
    const browser = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    if (browser.requestIdleCallback) {
      const id = browser.requestIdleCallback(() => setLoadUtilities(true), { timeout: 1_500 })
      return () => browser.cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(() => setLoadUtilities(true), 1_200)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background flex-col lg:flex-row">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full min-w-0">
          <AppNavbar />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
      {loadUtilities && (
        <Suspense fallback={null}>
          <GlobalStickyNotes />
          <BrowserCallDialog />
          <FollowUpReminderCenter />
        </Suspense>
      )}
    </SidebarProvider>
  )
}
