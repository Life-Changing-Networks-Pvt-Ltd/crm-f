// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileUp,
  Globe,
  Loader2,
  MessageCircle,
  Phone,
  ShieldCheck,
  Smartphone,
  KeyRound,
  X,
  Info,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@whatsapp/components/ui/tooltip";
import { Button } from "@whatsapp/components/ui/button";
import { Input } from "@whatsapp/components/ui/input";
import { Textarea } from "@whatsapp/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@whatsapp/components/ui/alert";
import { Badge } from "@whatsapp/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@whatsapp/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@whatsapp/components/ui/select";
import { useToast } from "@whatsapp/hooks/use-toast";
import { Label } from "@whatsapp/components/ui/label";
import { fetchWithAuth } from "@whatsapp/lib/fetchWithAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@whatsapp/components/ui/dialog";



export default function WhatsAppAccountSetup({ onConnected }: { onConnected: () => void }) {
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Test message from my connected WhatsApp number.");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [apiDialogOpen, setApiDialogOpen] = useState(false);
  const [isSavingApi, setIsSavingApi] = useState(false);
  const [apiCredentials, setApiCredentials] = useState({
    accessToken: "",
    phoneNumberId: "",
    businessAccountId: "",
    webhookVerifyToken: "",
  });
  const [connectedAccount, setConnectedAccount] = useState<any | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const connectThroughApis = async () => {
    const { accessToken, phoneNumberId, businessAccountId } = apiCredentials;
    if (!accessToken.trim() || !phoneNumberId.trim() || !businessAccountId.trim()) {
      toast({
        title: "Required API details missing",
        description: "Access Token, Phone Number ID and WhatsApp Business Account ID are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingApi(true);
    try {
      const response = await fetchWithAuth("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: "whatsapp",
          setAsDefault: true,
          credentials: {
            accessToken: accessToken.trim(),
            phoneNumberId: phoneNumberId.trim(),
            businessAccountId: businessAccountId.trim(),
            webhookVerifyToken: apiCredentials.webhookVerifyToken.trim(),
          },
        }),
      });
      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};
      if (!response.ok) throw new Error(data.error || "Unable to connect WhatsApp API");

      await queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-account-status"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/integrations/connections/status"] });
      setApiDialogOpen(false);
      setApiCredentials({
        accessToken: "",
        phoneNumberId: "",
        businessAccountId: "",
        webhookVerifyToken: "",
      });
      toast({
        title: "WhatsApp API connected",
        description: "This connection is encrypted and bound to the current account.",
      });
      onConnected();
    } catch (error) {
      toast({
        title: "API connection failed",
        description: error instanceof Error ? error.message : "Unable to verify WhatsApp API credentials.",
        variant: "destructive",
      });
    } finally {
      setIsSavingApi(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testPhone.trim() || !testMessage.trim()) {
      toast({
        title: "Test message details missing",
        description: "Enter a recipient number and message.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingTest(true);
    try {
      const response = await fetchWithAuth("/api/webhook/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testPhone.trim(), message: testMessage.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || "Failed to send test message");
      toast({
        title: "Test message sent",
        description: "Message was sent from the connected vendor number.",
      });
    } catch (error) {
      toast({
        title: "Test message failed",
        description: error instanceof Error ? error.message : "Unable to send test message.",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7fa]">
      <header className="flex min-h-16 items-center border-b bg-white px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#0b7c4b] text-white">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-tight">WhatsApp Business API</h1>
            <p className="text-sm text-muted-foreground">Connect your own number to send messages as your business.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
                  <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <Card className="rounded-lg border-green-200 bg-white">
              <CardHeader>
                <Badge className="w-fit bg-green-100 text-green-800">Not Verified</Badge>
                <CardTitle className="text-3xl">Connect Number</CardTitle>
                <CardDescription className="text-base">
                  Connect your WhatsApp Business API by providing your Meta Developer App credentials and access tokens.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  {["Create Meta App", "Generate Access Token", "Enter API Credentials"].map((item, index) => (
                    <div key={item} className="rounded-md border bg-[#f8fafc] p-3">
                      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0b7c4b] text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-[#0b7c4b] text-white" size="lg" onClick={() => setApiDialogOpen(true)}>
                    <KeyRound className="h-4 w-4" />
                    Connect through Meta APIs
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Before you start</CardTitle>
                <CardDescription>Keep these details ready for a smooth connection.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  "Meta Developer Account",
                  "WhatsApp Business Platform API Setup",
                  "System User Access Token",
                  "Phone Number ID & Business Account ID",
                ].map((item) => (
                  <div className="flex items-start gap-3" key={item}>
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#0b7c4b]" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {connectedAccount && (
              <Card className="rounded-lg border-green-200 bg-green-50 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xl text-green-900">Connected account</CardTitle>
                  <CardDescription>Send a test message from the connected vendor number.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Input placeholder="Recipient phone number, e.g. 919876543210" value={testPhone} onChange={(event) => setTestPhone(event.target.value)} />
                  <Textarea value={testMessage} onChange={(event) => setTestMessage(event.target.value)} />
                  <Button variant="outline" onClick={sendTestMessage} disabled={isSendingTest}>
                    {isSendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                    Send test message
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
      </main>

      <Dialog open={apiDialogOpen} onOpenChange={setApiDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Connect through WhatsApp APIs</DialogTitle>
            <DialogDescription>
              Enter credentials for this account. Secrets are encrypted before database storage and are never returned in plain text.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="wa-access-token">Permanent Access Token</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Generate this in Meta Business Settings &gt; System Users. Add WhatsApp assets and generate new token.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="wa-access-token"
                type="password"
                autoComplete="off"
                placeholder="Meta system-user access token"
                value={apiCredentials.accessToken}
                onChange={(event) =>
                  setApiCredentials((current) => ({ ...current, accessToken: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="wa-phone-id">Phone Number ID</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Found in Meta Developer Dashboard &gt; WhatsApp &gt; API Setup under 'Send and receive messages'.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="wa-phone-id"
                  placeholder="123456789012345"
                  value={apiCredentials.phoneNumberId}
                  onChange={(event) =>
                    setApiCredentials((current) => ({ ...current, phoneNumberId: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="wa-business-id">WhatsApp Business Account ID</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Found in Meta Developer Dashboard &gt; WhatsApp &gt; API Setup next to the Phone Number ID.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="wa-business-id"
                  placeholder="123456789012345"
                  value={apiCredentials.businessAccountId}
                  onChange={(event) =>
                    setApiCredentials((current) => ({ ...current, businessAccountId: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wa-webhook-token">Webhook Verify Token (optional)</Label>
              <Input
                id="wa-webhook-token"
                type="password"
                autoComplete="off"
                placeholder="Your custom webhook verification secret"
                value={apiCredentials.webhookVerifyToken}
                onChange={(event) =>
                  setApiCredentials((current) => ({ ...current, webhookVerifyToken: event.target.value }))
                }
              />
            </div>
          
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiDialogOpen(false)} disabled={isSavingApi}>
              Cancel
            </Button>
            <Button className="bg-[#0b7c4b] text-white" onClick={connectThroughApis} disabled={isSavingApi}>
              {isSavingApi ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Verify and connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
