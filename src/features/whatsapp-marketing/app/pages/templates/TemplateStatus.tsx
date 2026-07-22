// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@whatsapp/components/ui/card";
import { Badge } from "@whatsapp/components/ui/badge";
import { Button } from "@whatsapp/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@whatsapp/components/ui/table";
import { RefreshCw, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, FileText, Globe } from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@whatsapp/lib/fetchWithAuth";

interface MetaTemplate {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  content: string;
  header: string;
  footer: string;
  buttons: any[];
  qualityScore?: string;
  rejectedReason?: string;
}

interface TemplatesResponse {
  templates: MetaTemplate[];
  summary: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
}

export default function TemplateStatus() {
  const { data, isLoading, refetch, isRefetching, error } = useQuery<TemplatesResponse>({
    queryKey: ["/api/meta-templates"],
    queryFn: async () => {
      const res = await fetchWithAuth("/api/meta-templates");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch templates from Meta");
      }
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const handleRefresh = () => {
    refetch();
    toast.info("Refreshing templates from Facebook...");
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "in_appeal":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <AlertTriangle className="mr-1 h-3 w-3" />
            In Appeal
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      marketing: "bg-purple-100 text-purple-700 border-purple-200",
      utility: "bg-blue-100 text-blue-700 border-blue-200",
      authentication: "bg-orange-100 text-orange-700 border-orange-200",
    };
    return (
      <Badge variant="outline" className={colors[category.toLowerCase()] || ""}>
        {category}
      </Badge>
    );
  };

  const templates = data?.templates || [];
  const summary = data?.summary || { total: 0, approved: 0, pending: 0, rejected: 0 };

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Globe className="h-8 w-8 text-blue-600" />
              Template Status (Live from Facebook)
            </h2>
            <p className="text-muted-foreground">View real-time approval status directly from Meta/Facebook</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefetching}
          >
            {isRefetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh from Facebook
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{summary.total}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">{summary.approved}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-600">{summary.pending}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold text-red-600">{summary.rejected}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Templates from Meta</CardTitle>
            <CardDescription>
              Live data fetched directly from your WhatsApp Business Account on Facebook
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                <h3 className="font-medium text-lg mb-2">Unable to fetch templates</h3>
                <p className="text-muted-foreground mb-4">
                  {(error as Error).message || "Please configure your WhatsApp credentials in Settings."}
                </p>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No templates found</p>
                <p className="text-sm">Create templates in the Meta Business Suite to see them here.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Content Preview</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{getCategoryBadge(template.category)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.language}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-muted-foreground">
                        {template.content || template.header || "(No content)"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(template.status)}
                          {template.rejectedReason && (
                            <span className="text-xs text-red-500 mt-1">
                              Reason: {template.rejectedReason}
                            </span>
                          )}
                        </div>
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
