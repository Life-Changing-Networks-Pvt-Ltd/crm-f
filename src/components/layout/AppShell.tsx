import { Outlet } from "@tanstack/react-router"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { AppNavbar } from "./AppNavbar"
import { GlobalStickyNotes } from "../shared/GlobalStickyNotes"
import { BrowserCallDialog } from "../shared/BrowserCallDialog"
import { FollowUpReminderCenter } from "../shared/FollowUpReminderCenter"

export function AppShell() {
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
      <GlobalStickyNotes />
      <BrowserCallDialog />
      <FollowUpReminderCenter />
    </SidebarProvider>
  )
}
