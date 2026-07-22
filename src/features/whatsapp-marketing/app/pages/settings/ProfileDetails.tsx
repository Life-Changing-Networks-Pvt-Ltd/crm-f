// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, getAuthHeaders } from "@whatsapp/contexts/AuthContext";
import { Button } from "@whatsapp/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@whatsapp/components/ui/card";
import { Avatar, AvatarFallback } from "@whatsapp/components/ui/avatar";
import { Badge } from "@whatsapp/components/ui/badge";
import Swal from "sweetalert2";
import { User, Shield, ShieldCheck, UserCog, Crown, Mail, AtSign, Loader2, Unlink, TriangleAlert, BadgeCheck, Phone, Smartphone } from "lucide-react";

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  super_admin: { 
    label: "Super Admin", 
    color: "bg-red-100 text-red-800 border-red-200",
    icon: <Crown className="h-3 w-3" />
  },
  sub_admin: { 
    label: "Sub Admin", 
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: <ShieldCheck className="h-3 w-3" />
  },
  manager: { 
    label: "Manager", 
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <UserCog className="h-3 w-3" />
  },
  user: { 
    label: "User", 
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: <User className="h-3 w-3" />
  },
  admin: {
    label: "Admin",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: <Shield className="h-3 w-3" />
  }
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfileDetails() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const whatsappConnectionQuery = useQuery({
    queryKey: ["/api/integrations/connections/status"],
    queryFn: async () => {
      const response = await fetch("/api/integrations/connections/status", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Unable to check WhatsApp connection");
      const connections = await response.json();
      return Array.isArray(connections)
        ? connections.find((item) => item?.provider?.id === "whatsapp")
        : null;
    },
  });

  const whatsappProfileQuery = useQuery({
    queryKey: ["/api/integrations/whatsapp/profile"],
    queryFn: async () => {
      const response = await fetch("/api/integrations/whatsapp/profile", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Unable to load WhatsApp profile");
      return response.json();
    },
  });

  const delinkMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/integrations/whatsapp/delink", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ confirmation: "DELINK" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.details
            ? `${data.error || "Failed to delink WhatsApp account"}: ${data.details}`
            : data.error || "Failed to delink WhatsApp account",
        );
      }
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-account-status"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/integrations/connections/status"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/credentials"] }),
      ]);
      await Swal.fire({
        icon: "success",
        title: "WhatsApp account delinked",
        text: "Local WhatsApp data and credentials were deleted. Your Meta account was not changed.",
      });
      window.location.reload();
    },
    onError: (error: Error) => {
      Swal.fire("Delink failed", error.message, "error");
    },
  });

  const confirmDelink = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delink WhatsApp account?",
      html: `
        <div style="text-align:left">
          <p><strong>This permanently deletes this account's WhatsApp data from our database:</strong></p>
          <ul style="margin:12px 0 0 20px;list-style:disc">
            <li>WhatsApp credentials and connection</li>
            <li>Templates, flows and automations</li>
            <li>Contacts, chats and messages</li>
            <li>Campaigns, reports and delivery history</li>
          </ul>
          <p style="margin-top:14px"><strong>Nothing will be deleted from Meta Business Manager.</strong></p>
        </div>
      `,
      input: "text",
      inputLabel: 'Type "DELINK" to continue',
      inputPlaceholder: "DELINK",
      showCancelButton: true,
      confirmButtonText: "Delete local data & delink",
      confirmButtonColor: "#dc2626",
      focusCancel: true,
      preConfirm: (value) => {
        if (String(value || "").trim().toUpperCase() !== "DELINK") {
          Swal.showValidationMessage('Please type "DELINK" exactly');
          return false;
        }
        return true;
      },
    });
    if (result.isConfirmed) delinkMutation.mutate();
  };

  const roleConfig = ROLE_CONFIG[user?.role || "user"] || ROLE_CONFIG.user;

  if (!user) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Profile Details</h2>
            <p className="text-muted-foreground">View and update your account information.</p>
          </div>
          <Badge className={`${roleConfig.color} flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium`}>
            {roleConfig.icon}
            {roleConfig.label}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your login and role details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">{user.name}</h3>
                  <Badge variant="outline" className={`${roleConfig.color} flex items-center gap-1 w-fit`}>
                    {roleConfig.icon}
                    {roleConfig.label}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <AtSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Username</p>
                    <p className="font-medium">{user.username}</p>
                  </div>
                </div>

                {user.email && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email Address</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">User ID</p>
                    <p className="font-mono text-sm">{user.id}</p>
                  </div>
                </div>

                {user.pageAccess && user.pageAccess.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-2">Page Access</p>
                    <div className="flex flex-wrap gap-1.5">
                      {user.pageAccess.map(page => (
                        <Badge key={page} variant="secondary" className="text-xs capitalize">
                          {page.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Business Account</CardTitle>
              <CardDescription>Approved account details fetched from the connected WhatsApp Business API.</CardDescription>
            </CardHeader>
            <CardContent>
              {whatsappProfileQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading WhatsApp account
                </div>
              ) : whatsappProfileQuery.data?.isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <BadgeCheck className="h-5 w-5 text-green-600" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Approved Display Name</p>
                      <p className="truncate font-medium">
                        {whatsappProfileQuery.data?.verifiedName || "Not available"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">WhatsApp Phone Number</p>
                      <p className="truncate font-medium">
                        {whatsappProfileQuery.data?.displayPhoneNumber || "Not available"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Phone Number ID</p>
                      <p className="truncate font-mono text-sm">
                        {whatsappProfileQuery.data?.phoneNumberId || "Not available"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No approved WhatsApp Business account is connected yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {whatsappConnectionQuery.data?.isConnected && (
          <Card className="border-red-200 bg-red-50/40">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-red-100 p-2 text-red-700">
                  <TriangleAlert className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-red-900">WhatsApp Account Connection</CardTitle>
                  <CardDescription className="mt-1 text-red-800/80">
                    Delink this WhatsApp account to remove its credentials and all related WhatsApp data from our database.
                    This does not delete or modify anything in Meta Business Manager.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardFooter>
              <Button
                variant="destructive"
                onClick={confirmDelink}
                disabled={delinkMutation.isPending}
              >
                {delinkMutation.isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Unlink className="mr-2 h-4 w-4" />}
                Delink WhatsApp Account
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </>
  );
}
