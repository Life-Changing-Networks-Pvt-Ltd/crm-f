// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@whatsapp/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@whatsapp/components/ui/table";
import { Badge } from "@whatsapp/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@whatsapp/components/ui/dropdown-menu";
import { 
  Megaphone, 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  Clock,
  PlayCircle,
  Loader2,
  Play,
  Trash2,
  Eye
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@whatsapp/components/ui/card";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  message: string;
  contactIds: string[];
  status: "draft" | "scheduled" | "running" | "completed" | "paused";
  scheduledAt?: string;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  repliedCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function Campaigns() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns");
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/campaigns/${id}/send`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to send campaign");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast.success("Campaign sent successfully!");
    },
    onError: () => {
      toast.error("Failed to send campaign");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete campaign");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast.success("Campaign deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete campaign");
    },
  });

  const activeCampaigns = campaigns.filter(c => c.status === "running").length;
  const scheduledCampaigns = campaigns.filter(c => c.status === "scheduled").length;
  const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "secondary";
      case "running": return "default";
      case "scheduled": return "outline";
      case "draft": return "outline";
      default: return "secondary";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
       <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Campaigns</h2>
            <p className="text-muted-foreground">Manage your broadcast lists and scheduled messages.</p>
          </div>
          <Button onClick={() => setLocation("/campaigns/broadcast")}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Campaigns
              </CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCampaigns}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Running right now
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Scheduled
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduledCampaigns}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Upcoming
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Messages Sent
              </CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total across all campaigns
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Campaigns</CardTitle>
            <CardDescription>
              A list of all your recent broadcasts and automated sequences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No campaigns yet. Create your first campaign to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Read</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusColor(campaign.status)}
                          className={campaign.status === 'running' ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{campaign.sentCount.toLocaleString()}</TableCell>
                      <TableCell>{campaign.deliveredCount.toLocaleString()}</TableCell>
                      <TableCell>{campaign.readCount.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {campaign.scheduledAt ? formatDate(campaign.scheduledAt) : formatDate(campaign.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLocation(`/campaigns/report`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Report
                            </DropdownMenuItem>
                            {(campaign.status === "draft" || campaign.status === "scheduled") && (
                              <DropdownMenuItem onClick={() => sendMutation.mutate(campaign.id)}>
                                <Play className="mr-2 h-4 w-4" />
                                Send Now
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => deleteMutation.mutate(campaign.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
       </div>
    </>
  );
}
