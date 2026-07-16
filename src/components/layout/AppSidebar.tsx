import {
  LayoutDashboard,
  Users,
  Building2,
  Contact2,
  BadgeDollarSign,
  KanbanSquare,
  FileText,
  Receipt,
  Megaphone,
  Mail,
  MessageSquare,
  Phone,
  Video,
  ListTodo,
  Calendar,
  StickyNote,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  UserCircle,
  Settings,
  Shield,
  Users2,
  Bell,
  Link,
  History,
} from "lucide-react"

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

const navItems = [
  {
    title: "Dashboard",
    items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
  },
  {
    title: "CRM",
    items: [
      { title: "Leads", url: "/leads", icon: Users },
      { title: "Customers", url: "/customers", icon: UserCircle },
      { title: "Companies", url: "/companies", icon: Building2 },
      { title: "Contacts", url: "/contacts", icon: Contact2 },
    ],
  },

  {
    title: "Marketing",
    items: [
      { title: "Campaigns", url: "/campaigns", icon: Megaphone },
      { title: "Email Marketing", url: "/email-marketing", icon: Mail },
      { title: "WhatsApp Marketing", url: "/whatsapp-campaigns", icon: MessageSquare },
    ],
  },
  {
    title: "Communication",
    items: [
      { title: "Messages", url: "/messages", icon: MessageSquare },
      { title: "Email Inbox", url: "/email-inbox", icon: Mail },
      { title: "Calls", url: "/calls", icon: Phone },
      { title: "Meetings", url: "/meetings", icon: Video },
    ],
  },
  {
    title: "Tasks",
    items: [
      { title: "Tasks", url: "/tasks", icon: ListTodo },
      { title: "Calendar", url: "/calendar", icon: Calendar },
      { title: "Notes", url: "/notes", icon: StickyNote },
      { title: "Activities", url: "/activities", icon: Activity },
    ],
  },
  {
    title: "Reports",
    items: [
      { title: "Dashboard Reports", url: "/reports/dashboard", icon: BarChart3 },
      { title: "Sales Reports", url: "/reports/sales", icon: LineChart },
      { title: "Marketing Reports", url: "/reports/marketing", icon: PieChart },
      { title: "User Reports", url: "/reports/users", icon: Users },
      { title: "Meeting Reports", url: "/meeting-reports", icon: FileText },
    ],
  },
  {
    title: "Administration",
    items: [
      { title: "Users", url: "/users", icon: Users },
      { title: "Roles & Permissions", url: "/roles", icon: Shield },
      { title: "Page Access", url: "/page-access", icon: Shield },
      { title: "Teams", url: "/teams", icon: Users2 },
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
    if ((url === '/users' || url === '/reports/users') && user.role !== 'admin') return false;
    if (user.role === 'admin') return true; // Super admin sees everything
    return user.permissions?.includes(url) || false;
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
            Antigravity CRM
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
                    >
                      <RouterLink to={item.url as any}>
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
