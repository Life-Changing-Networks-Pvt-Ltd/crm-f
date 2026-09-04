import {
  LayoutDashboard,
  Users,
  FileText,
  Megaphone,
  Mail,
  MessageSquare,
  Video,
  ListTodo,
  Calendar,
  StickyNote,
  BarChart3,
  LineChart,
  UserCircle,
  Settings,
  Shield,
  Users2,
  Bell,
  ClipboardList,
  Clock,
  PhoneCall
} from "lucide-react"
import { Share2 } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Link as RouterLink, useLocation } from "@tanstack/react-router"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { canOpenPage } from "@/lib/accessControl"
import { prefetchPageData } from "@/lib/pagePrefetch"

const navItems = [
  {
    title: "Dashboard",
    items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
  },
  {
    title: "CRM",
    items: [
      { title: "Leads", url: "/leads", icon: Users },
      { title: "Employees", url: "/employees", icon: UserCircle },
      { title: "Attendance", url: "/attendance", icon: Clock },
    ],
  },

  {
    title: "Marketing",
    items: [
      { title: "Campaigns", url: "/campaigns", icon: Megaphone },
      { title: "Email Marketing", url: "/email-marketing", icon: Mail },
      { title: "WhatsApp Marketing", url: "/whatsapp-marketing", icon: MessageSquare },
    ],
  },
  {
    title: "Communication",
    items: [
      { title: "Messages", url: "/messages", icon: MessageSquare },
      { title: "Email Inbox", url: "/email-inbox", icon: Mail },
      { title: "Meetings", url: "/meetings", icon: Video },
      { title: "Calling", url: "/calling", icon: PhoneCall },
      { title: "Call History", url: "/calls", icon: PhoneCall },
    ],
  },
  {
    title: "Tasks",
    items: [
      { title: "Tasks", url: "/tasks", icon: ListTodo },
      { title: "Calendar", url: "/calendar", icon: Calendar },
      { title: "Notes", url: "/notes", icon: StickyNote },
    ],
  },
  {
    title: "Reports",
    items: [
      { title: "Business Overview", url: "/reports/dashboard", icon: BarChart3 },
      { title: "Sales Reports", url: "/reports/sales", icon: LineChart },
      { title: "User Reports", url: "/reports/users", icon: Users },
      { title: "Meeting Reports", url: "/meeting-reports", icon: FileText },
      { title: "Attendance Reports", url: "/reports/attendance", icon: FileText },
    ],
  },
  {
    title: "Administration",
    items: [
      { title: "Users", url: "/users", icon: Users },
      { title: "Roles & Permissions", url: "/roles", icon: Shield },
      { title: "Access Control", url: "/page-access", icon: Shield },
      { title: "Teams", url: "/teams", icon: Users2 },
      { title: "Template Access", url: "/template-access", icon: Share2 },
      { title: "Audit Logs", url: "/audit-logs", icon: ClipboardList },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
  {
    title: "System",
    items: [
      { title: "Profile", url: "/profile", icon: UserCircle },
      { title: "Notifications", url: "/notifications", icon: Bell },
    ],
  },
]

export function AppSidebar() {
  const location = useLocation()
  const { user } = useSelector((state: RootState) => state.auth)

  const hasAccess = (url: string) => {
    if (!user) return false;
    return canOpenPage(user, url);
  }

  // Filter items based on permissions
  const filteredNavItems = navItems.map(group => ({
    ...group,
    items: group.items.filter(item => hasAccess(item.url))
  })).filter(group => group.items.length > 0);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-14 items-center justify-center border-b px-4 lg:h-[60px]">
        <RouterLink to="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <span className="truncate group-data-[collapsible=icon]:hidden">
            OPH Workplace
          </span>
        </RouterLink>
      </SidebarHeader>
      <SidebarContent>
        {filteredNavItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url || location.pathname.startsWith(`${item.url}/`)}
                      tooltip={item.title}
                      className="rounded-xl text-[#374151] transition-colors duration-200 hover:bg-[#FFF3E3] hover:text-[#A85F08] focus-visible:ring-[#C97816] active:bg-[#FFE8CC] active:text-[#A85F08] data-[active=true]:bg-[#C97816] data-[active=true]:font-semibold data-[active=true]:text-white data-[active=true]:shadow-[0_6px_16px_rgba(201,120,22,0.22)] data-[active=true]:hover:bg-[#A95F0B] data-[active=true]:hover:text-white data-[active=true]:active:bg-[#A95F0B] data-[active=true]:active:text-white data-[active=true]:[&>svg]:text-white"
                    >
                      <RouterLink
                        to={item.url as any}
                        onMouseEnter={() => prefetchPageData(item.url)}
                        onFocus={() => prefetchPageData(item.url)}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </RouterLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
