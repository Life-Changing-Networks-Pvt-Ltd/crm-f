import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/layout/EmptyState"
import { Button } from "@/components/ui/button"
import { CheckCheck, Trash2, Info, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react"
import api from "@/services/api"
import { queryClient } from "@/lib/queryClient"
import { crmQueryKeys, fetchNotificationSummary, type CrmNotification } from "@/lib/crmQueries"
import { DataPagination } from "@/components/shared/DataPagination"
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery"
import { toast } from "sonner"
import Swal from "sweetalert2"

export default function Notifications() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const {
    data,
    isLoading: loading,
    refetch: refetchNotifications,
  } = usePaginatedQuery<CrmNotification>({
    endpoint: "/notifications/paged",
    page,
    limit: 25,
  });
  const notifications = data?.items || [];
  const { data: summary } = useQuery({
    queryKey: crmQueryKeys.notificationSummary,
    queryFn: fetchNotificationSummary,
  });

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      await Promise.all([
        refetchNotifications(),
        queryClient.invalidateQueries({ queryKey: crmQueryKeys.notificationSummary }),
      ]);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark notifications as read");
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      await Promise.all([
        refetchNotifications(),
        queryClient.invalidateQueries({ queryKey: crmQueryKeys.notificationSummary }),
      ]);
    } catch {
      console.error("Failed to mark as read");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      await Promise.all([
        refetchNotifications(),
        queryClient.invalidateQueries({ queryKey: crmQueryKeys.notificationSummary }),
      ]);
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const handleClearAll = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete all notifications? This cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, clear all!'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await api.delete('/notifications');
      await Promise.all([
        refetchNotifications(),
        queryClient.invalidateQueries({ queryKey: crmQueryKeys.notificationSummary }),
      ]);
      toast.success("All notifications cleared");
    } catch {
      toast.error("Failed to clear notifications");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const unreadCount = summary?.unreadCount || 0;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader title="Notifications" description="View and manage your recent notifications.">
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="destructive" onClick={handleClearAll}>
              <Trash2 className="mr-2 h-4 w-4" /> Clear all
            </Button>
          )}
        </div>
      </PageHeader>
      
      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications found"
          description="You're all caught up! No new alerts."
          actionLabel="Check Again"
          onAction={() => { void refetchNotifications() }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map(notif => (
            <div 
              key={notif._id} 
              className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${!notif.isRead ? 'bg-muted/30 border-primary/20' : 'bg-card'}`}
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
              <div className="mt-1 flex-shrink-0">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className={`text-base font-semibold truncate ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className={`text-sm ${!notif.isRead ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                  {notif.message}
                </p>
              </div>
              <div className="flex-shrink-0 ml-4 flex items-center gap-2">
                {!notif.isRead && (
                  <div className="h-2 w-2 rounded-full bg-blue-600 mt-2"></div>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notif._id);
                  }}
                  title="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {data?.pagination && (
            <DataPagination pagination={data.pagination} onPageChange={setPage} />
          )}
        </div>
      )}
    </div>
  )
}
