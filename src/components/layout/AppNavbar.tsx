import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumbs } from "./Breadcrumbs"
import { SearchBar } from "./SearchBar"
import { ThemeToggle } from "./ThemeToggle"
import { UserDropdown } from "./UserDropdown"

export function AppNavbar() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] shrink-0">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumbs />
      <div className="flex flex-1 items-center justify-end gap-4">
        <SearchBar />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-600"></span>
          <span className="sr-only">Toggle notifications</span>
        </Button>
        <ThemeToggle />
        <UserDropdown />
      </div>
    </header>
  )
}
