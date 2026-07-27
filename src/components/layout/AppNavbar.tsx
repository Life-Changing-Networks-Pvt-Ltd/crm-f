import { Bell, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { queryClient } from "@/lib/queryClient"
import { crmQueryKeys, fetchNotificationSummary, type NotificationSummary } from "@/lib/crmQueries"
// import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Breadcrumbs } from "./Breadcrumbs"
import { SearchBar } from "./SearchBar"
import { ThemeToggle } from "./ThemeToggle"
import { UserDropdown } from "./UserDropdown"

export function AppNavbar() {
  const navigate = useNavigate();
  const { data: summary = { items: [], unreadCount: 0 } } = useQuery({
    queryKey: crmQueryKeys.notificationSummary,
    queryFn: fetchNotificationSummary,
    refetchInterval: 60_000,
  });

  const unreadCount = summary.unreadCount;
  const recentNotifications = summary.items;

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      queryClient.setQueryData<NotificationSummary>(
        crmQueryKeys.notificationSummary,
        (current) => current ? {
          items: current.items.map(n => n._id === id ? { ...n, isRead: true } : n),
          unreadCount: Math.max(0, current.unreadCount - (current.items.some(n => n._id === id && !n.isRead) ? 1 : 0)),
        } : current,
      );
      void queryClient.invalidateQueries({ queryKey: ["paged", "/notifications/paged"] });
    } catch {
      console.error("Failed to mark as read");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] shrink-0">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumbs />
      <div className="flex flex-1 items-center justify-end gap-4">
        <SearchBar />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-600">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                </span>
              )}
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs font-normal text-muted-foreground">{unreadCount} unread</span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <div className="max-h-[300px] overflow-y-auto">
              {recentNotifications.length > 0 ? (
                recentNotifications.map((notif) => (
                  <DropdownMenuItem 
                    key={notif._id} 
                    className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notif.isRead ? 'bg-muted/50' : ''}`}
                    onClick={() => {
                      if (!notif.isRead) handleMarkAsRead(notif._id);
                      if (notif.title.includes('Meeting')) {
                        navigate({ to: '/meetings' });
                      } else if (notif.title.includes('Lead')) {
                        if (notif.message.includes('Company')) navigate({ to: '/companies' });
                        else navigate({ to: '/leads' });
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {getIcon(notif.type)}
                      <span className="font-medium text-sm flex-1 truncate">{notif.title}</span>
                      {!notif.isRead && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0"></span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-2 w-full pl-6">
                      {notif.message}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 pl-6 mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </div>
              )}
            </div>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="justify-center text-primary cursor-pointer font-medium"
              onClick={() => navigate({ to: '/notifications' })}
            >
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />
        <UserDropdown />
      </div>
    </header>
  )
}
