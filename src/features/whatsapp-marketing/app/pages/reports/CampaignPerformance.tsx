// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@whatsapp/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@whatsapp/components/ui/table";
import { Badge } from "@whatsapp/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@whatsapp/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2, Target, Send, Eye, MessageSquare, DollarSign } from "lucide-react";
import { fetchWithAuth } from "@whatsapp/lib/fetchWithAuth";

interface Campaign {
  id: string;
  name: string;
  date: string;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
  deliveryRate: number;
  readRate: number;
  replyRate: number;
  cost: string;
}

interface ChartData {
  name: string;
  sent: number;
  read: number;
  replied: number;
}

interface CampaignPerformanceData {
  campaigns: Campaign[];
  chartData: ChartData[];
  summary: {
    totalCampaigns: number;
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    totalReplied: number;
    avgDeliveryRate: number;
    avgReadRate: number;
    avgReplyRate: number;
    totalCost: string;
  };
  period: string;
}

export default function CampaignPerformance() {
  const [period, setPeriod] = useState("week");

  const { data, isLoading, error } = useQuery<CampaignPerformanceData>({
    queryKey: ["/api/reports/campaign-performance", period],
    queryFn: async () => {
      const res = await fetchWithAuth(`/api/reports/campaign-performance?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch campaign performance");
      return res.json();
    },
  });

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Target className="h-8 w-8 text-primary" />
              Campaign Performance
            </h2>
            <p className="text-muted-foreground">ROI and engagement metrics for your broadcasts.</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Failed to load campaign data</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Campaigns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary.totalCampaigns || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Total Sent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(data?.summary.totalSent || 0).toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Read Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{data?.summary.avgReadRate || 0}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Reply Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{data?.summary.avgReplyRate || 0}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${data?.summary.totalCost || '0.00'}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Comparison</CardTitle>
                <CardDescription>Compare Sent vs Read vs Replied across top campaigns.</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.chartData && data.chartData.length > 0 ? (
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer minWidth={1} minHeight={1} width="100%" height="100%">
                      <BarChart data={data.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                          contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "var(--radius)" }}
                        />
                        <Legend />
                        <Bar dataKey="sent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Sent" />
                        <Bar dataKey="read" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Read" />
                        <Bar dataKey="replied" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name="Replied" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No campaign data for this period.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Report</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.campaigns && data.campaigns.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead>Delivered</TableHead>
                        <TableHead>Read Rate</TableHead>
                        <TableHead>Reply Rate</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium">{campaign.name}</TableCell>
                          <TableCell className="text-muted-foreground">{campaign.date}</TableCell>
                          <TableCell>{campaign.sent.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                              {campaign.deliveryRate}%
                            </Badge>
                          </TableCell>
                          <TableCell>{campaign.readRate}%</TableCell>
                          <TableCell>{campaign.replyRate}%</TableCell>
                          <TableCell className="text-right font-medium">${campaign.cost}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No campaigns found for this period. Send a broadcast to see data here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}

