// @ts-nocheck
import { lazy, Suspense } from "react";
import { Switch, Route, Redirect, Router as WouterRouter, useLocation } from "wouter";
import DashboardLayout from "@whatsapp/components/layout/DashboardLayout";
import { Loader2 } from "lucide-react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@whatsapp/components/ui/toaster";
import { TooltipProvider } from "@whatsapp/components/ui/tooltip";
import { AuthProvider, useAuth } from "@whatsapp/contexts/AuthContext";
import { installWhatsAppApiFetchAdapter } from "@whatsapp/lib/apiBase";
import { fetchWithAuth } from "@whatsapp/lib/fetchWithAuth";
const NotFound = lazy(() => import("@whatsapp/pages/not-found"));
const Login = lazy(() => import("@whatsapp/pages/Login"));
const ForgotPassword = lazy(() => import("@whatsapp/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@whatsapp/pages/ResetPassword"));
const SellersLoginLaunch = lazy(() => import("@whatsapp/pages/SellersLoginLaunch"));
const WhatsAppAccountSetup = lazy(() => import("@whatsapp/pages/WhatsAppAccountSetup"));
const Dashboard = lazy(() => import("@whatsapp/pages/dashboard"));
const Inbox = lazy(() => import("@whatsapp/pages/inbox"));
const WindowInbox = lazy(() => import("@whatsapp/pages/inbox/WindowInbox"));
const WhatsAppLeads = lazy(() => import("@whatsapp/pages/inbox/WhatsAppLeads"));
const Campaigns = lazy(() => import("@whatsapp/pages/campaigns"));
const Automation = lazy(() => import("@whatsapp/pages/automation"));
const Contacts = lazy(() => import("@whatsapp/pages/contacts"));
const Settings = lazy(() => import("@whatsapp/pages/settings"));
const ProfileDetails = lazy(() => import("@whatsapp/pages/settings/ProfileDetails"));
const WebhookAPI = lazy(() => import("@whatsapp/pages/settings/WebhookAPI"));
const WebhookEvents = lazy(() => import("@whatsapp/pages/settings/WebhookEvents"));
const Templates = lazy(() => import("@whatsapp/pages/templates"));
const Broadcast = lazy(() => import("@whatsapp/pages/campaigns/Broadcast"));
const SelectedContacts = lazy(() => import("@whatsapp/pages/campaigns/SelectedContacts"));
const Schedule = lazy(() => import("@whatsapp/pages/campaigns/Schedule"));
const Single = lazy(() => import("@whatsapp/pages/campaigns/Single"));
const Report = lazy(() => import("@whatsapp/pages/campaigns/Report"));
const CampaignPage = lazy(() => import("@whatsapp/pages/campaigns/CampaignPage"));
const AutoLeads = lazy(() => import("@whatsapp/pages/automation/AutoLeads"));
const Keywords = lazy(() => import("@whatsapp/pages/automation/Keywords"));
const FollowUp = lazy(() => import("@whatsapp/pages/automation/FollowUp"));
const Drip = lazy(() => import("@whatsapp/pages/automation/Drip"));
const NewLeads = lazy(() => import("@whatsapp/pages/automation/NewLeads"));
const AutomationDashboard = lazy(() => import("@whatsapp/pages/automation/AutomationDashboard"));
const TriggersPage = lazy(() => import("@whatsapp/pages/automation/TriggersPage"));
const FlowsPage = lazy(() => import("@whatsapp/pages/automation/FlowsPage"));
const FlowEditor = lazy(() => import("@whatsapp/pages/automation/FlowEditor"));
const CampaignsPage = lazy(() => import("@whatsapp/pages/automation/CampaignsPage"));
const SegmentsPage = lazy(() => import("@whatsapp/pages/automation/SegmentsPage"));
const AnalyticsPage = lazy(() => import("@whatsapp/pages/automation/AnalyticsPage"));
const InterestLists = lazy(() => import("@whatsapp/pages/automation/InterestLists"));
const ConnectApps = lazy(() => import("@whatsapp/pages/apps/ConnectApps"));
const AddTemplate = lazy(() => import("@whatsapp/pages/templates/AddTemplate"));
const TemplateStatus = lazy(() => import("@whatsapp/pages/templates/TemplateStatus"));
const ManageTemplates = lazy(() => import("@whatsapp/pages/templates/ManageTemplates"));
const NewAgent = lazy(() => import("@whatsapp/pages/ai/NewAgent"));
const AgentsPage = lazy(() => import("@whatsapp/pages/ai/AgentsPage"));
const MapAgent = lazy(() => import("@whatsapp/pages/ai/MapAgent"));
const AgentReports = lazy(() => import("@whatsapp/pages/ai/AgentReports"));
const PrefilledTextMappings = lazy(() => import("@whatsapp/pages/ai/PrefilledTextMappings"));
const LeadForms = lazy(() => import("@whatsapp/pages/facebook/LeadForms"));
const Leads = lazy(() => import("@whatsapp/pages/facebook/Leads"));
const DeliveryReport = lazy(() => import("@whatsapp/pages/reports/DeliveryReport"));
const CampaignPerformance = lazy(() => import("@whatsapp/pages/reports/CampaignPerformance"));
const CustomerReplies = lazy(() => import("@whatsapp/pages/reports/CustomerReplies"));
const AgentPerformance = lazy(() => import("@whatsapp/pages/reports/AgentPerformance"));
const Credits = lazy(() => import("@whatsapp/pages/reports/Credits"));
const UserEngagement = lazy(() => import("@whatsapp/pages/reports/UserEngagement"));
const BroadcastReports = lazy(() => import("@whatsapp/pages/reports/BroadcastReports"));
const SingleMessageReports = lazy(() => import("@whatsapp/pages/SingleMessageReports"));
const BlockedContacts = lazy(() => import("@whatsapp/pages/reports/BlockedContacts"));
const ContactReports = lazy(() => import("@whatsapp/pages/reports/ContactReports"));
const UserManagement = lazy(() => import("@whatsapp/pages/UserManagement"));
const LeadAssignmentReports = lazy(() => import("@whatsapp/pages/lead-assignment-reports"));
const UserActivityReports = lazy(() => import("@whatsapp/pages/user-activity-reports"));
const ContactUsageDetail = lazy(() => import("./pages/ContactUsageDetails"));
const AiUsageDashboard = lazy(() => import("./pages/AiUsageDashboard"));
const UserManagementDashboard = lazy(() => import("./pages/UserManagementDashboard"));
const Register = lazy(() => import("./pages/Register"));
const FBLeadAutomationReport = lazy(() => import("./pages/FbleadsReport"));
const DripCampaignReport = lazy(() => import("./pages/DripCampaignReport"));
const WhatsAppFlowReport = lazy(() => import("./pages/WhatsAppFlowReport"));
const MessageUsage = lazy(() => import("./pages/usage/MessageUsage"));
const TemplateUsage = lazy(() => import("./pages/usage/TemplateUsage"));
const PricingUsage = lazy(() => import("./pages/usage/PricingUsage"));
const MetaFlows = lazy(() => import("./pages/MetaFlows"));

installWhatsAppApiFetchAdapter();
function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const whatsappStatusQuery = useQuery({
    queryKey: ["/api/whatsapp-account-status"],
    enabled: isAuthenticated && !isLoading,
    staleTime: 15000,
    queryFn: async () => {
      const [credentialsResponse, integrationsResponse] = await Promise.all([
        fetchWithAuth("/api/credentials"),
        fetchWithAuth("/api/integrations/connections/status"),
      ]);

      const credentialsData = credentialsResponse.ok
        ? await credentialsResponse.json()
        : null;
      const integrationsData = integrationsResponse.ok
        ? await integrationsResponse.json()
        : [];

      const hasSavedWhatsAppCredentials = Boolean(
        credentialsData?.status?.hasWhatsApp || credentialsData?.status?.isVerified
      );
      const whatsappIntegration = Array.isArray(integrationsData)
        ? integrationsData.find((item) => item?.provider?.id === "whatsapp")
        : null;
      const hasConnectedIntegration = Boolean(
        whatsappIntegration?.isConnected &&
        whatsappIntegration?.connection?.status === "connected"
      );

      return {
        isConnected: hasSavedWhatsAppCredentials || hasConnectedIntegration,
      };
    },
  });

  if (isLoading) {
    return null;
  }
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  if (whatsappStatusQuery.isPending || (whatsappStatusQuery.isFetching && !whatsappStatusQuery.data)) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!whatsappStatusQuery.data?.isConnected) {
    return <WhatsAppAccountSetup onConnected={() => whatsappStatusQuery.refetch()} />;
  }
  return <Component />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {isLoading ? null : isAuthenticated ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route path="/forgot-password">
        {isLoading ? null : isAuthenticated ? <Redirect to="/" /> : <ForgotPassword />}
      </Route>
      <Route path="/reset-password">
        {isLoading ? null : isAuthenticated ? <Redirect to="/" /> : <ResetPassword />}
      </Route>
      <Route path="/launch/sellerslogin">
        <SellersLoginLaunch />
      </Route>
      <Route path="/">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/inbox/window">
        {() => <ProtectedRoute component={WindowInbox} />}
      </Route>
      <Route path="/inbox/leads">
        {() => <ProtectedRoute component={WhatsAppLeads} />}
      </Route>
      <Route path="/inbox">{() => <ProtectedRoute component={Inbox} />}</Route>
      <Route path="/whatsapp-flows">
        {() => <ProtectedRoute component={MetaFlows} />}
      </Route>

      {/* Campaigns */}
      <Route path="/campaigns">
        {() => <ProtectedRoute component={Campaigns} />}
      </Route>
      <Route path="/campaigns/manager">
        {() => <ProtectedRoute component={CampaignPage} />}
      </Route>
      <Route path="/campaigns/broadcast">
        {() => <ProtectedRoute component={Broadcast} />}
      </Route>
      <Route path="/campaigns/selected-contacts">
        {() => <ProtectedRoute component={SelectedContacts} />}
      </Route>
      <Route path="/campaigns/schedule">
        {() => <ProtectedRoute component={Schedule} />}
      </Route>
      <Route path="/campaigns/single">
        {() => <ProtectedRoute component={Single} />}
      </Route>
      <Route path="/campaigns/report">
        {() => <ProtectedRoute component={Report} />}
      </Route>

      {/* Automation */}
      <Route path="/automation">
        {() => <ProtectedRoute component={Automation} />}
      </Route>
      <Route path="/automation/dashboard">
        {() => <ProtectedRoute component={AutomationDashboard} />}
      </Route>
      <Route path="/automation/triggers">
        {() => <ProtectedRoute component={TriggersPage} />}
      </Route>
      <Route path="/automation/triggers/new">
        {() => <ProtectedRoute component={TriggersPage} />}
      </Route>
      <Route path="/automation/flows">
        {() => <ProtectedRoute component={FlowsPage} />}
      </Route>
      <Route path="/automation/flows/new">
        {() => <ProtectedRoute component={FlowEditor} />}
      </Route>
      <Route path="/automation/flows/:flowId/edit">
        {() => <ProtectedRoute component={FlowEditor} />}
      </Route>
      <Route path="/automation/campaigns">
        {() => <ProtectedRoute component={CampaignsPage} />}
      </Route>
      <Route path="/automation/segments">
        {() => <ProtectedRoute component={SegmentsPage} />}
      </Route>
      <Route path="/automation/analytics">
        {() => <ProtectedRoute component={AnalyticsPage} />}
      </Route>
      <Route path="/automation/interest">
        {() => <ProtectedRoute component={InterestLists} />}
      </Route>
      <Route path="/automation/leads">
        {() => <ProtectedRoute component={AutoLeads} />}
      </Route>
      <Route path="/automation/keywords">
        {() => <ProtectedRoute component={Keywords} />}
      </Route>
      <Route path="/automation/follow-up">
        {() => <ProtectedRoute component={FollowUp} />}
      </Route>
      <Route path="/automation/drip">
        {() => <ProtectedRoute component={Drip} />}
      </Route>
      <Route path="/automation/new-leads">
        {() => <ProtectedRoute component={NewLeads} />}
      </Route>

      {/* Apps */}
      <Route path="/apps/connect">
        {() => <ProtectedRoute component={ConnectApps} />}
      </Route>

      {/* Templates */}
      <Route path="/templates">
        {() => <ProtectedRoute component={Templates} />}
      </Route>
      <Route path="/templates/add">
        {() => <ProtectedRoute component={AddTemplate} />}
      </Route>
      <Route path="/templates/status">
        {() => <ProtectedRoute component={TemplateStatus} />}
      </Route>
      <Route path="/templates/manage">
        {() => <ProtectedRoute component={ManageTemplates} />}
      </Route>

      {/* Usage */}
      <Route path="/usage/messages">
        {() => <ProtectedRoute component={MessageUsage} />}
      </Route>
      <Route path="/usage/templates">
        {() => <ProtectedRoute component={TemplateUsage} />}
      </Route>
      <Route path="/usage/pricing">
        {() => <ProtectedRoute component={PricingUsage} />}
      </Route>

      {/* AI */}
      <Route path="/ai">
        {() => <ProtectedRoute component={AgentsPage} />}
      </Route>
      <Route path="/ai/new">
        {() => <ProtectedRoute component={NewAgent} />}
      </Route>
      <Route path="/ai/manage">
        {() => <ProtectedRoute component={AgentsPage} />}
      </Route>
      <Route path="/ai/agents">
        {() => <ProtectedRoute component={AgentsPage} />}
      </Route>
      <Route path="/ai/map">
        {() => <ProtectedRoute component={MapAgent} />}
      </Route>
      <Route path="/ai/prefilled">
        {() => <ProtectedRoute component={PrefilledTextMappings} />}
      </Route>
      <Route path="/ai/reports">
        {() => <ProtectedRoute component={AgentReports} />}
      </Route>

      {/* Facebook */}
      <Route path="/facebook/forms">
        {() => <ProtectedRoute component={LeadForms} />}
      </Route>
      <Route path="/facebook/leads">
        {() => <ProtectedRoute component={Leads} />}
      </Route>

      {/* WhatsApp */}

      {/* Reports */}
      <Route path="/reports">
        {() => <ProtectedRoute component={DeliveryReport} />}
      </Route>
      <Route path="/reports/delivery">
        {() => <ProtectedRoute component={DeliveryReport} />}
      </Route>
      <Route path="/reports/campaign">
        {() => <ProtectedRoute component={CampaignPerformance} />}
      </Route>
      <Route path="/reports/replies">
        {() => <ProtectedRoute component={CustomerReplies} />}
      </Route>
      <Route path="/reports/agents">
        {() => <ProtectedRoute component={AgentPerformance} />}
      </Route>
      <Route path="/reports/credits">
        {() => <ProtectedRoute component={Credits} />}
      </Route>
      <Route path="/reports/user-engagement">
        {() => <ProtectedRoute component={UserEngagement} />}
      </Route>
      <Route path="/reports/broadcast">
        {() => <ProtectedRoute component={BroadcastReports} />}
      </Route>
      <Route path="/reports/single-messages">
        {() => <ProtectedRoute component={SingleMessageReports} />}
      </Route>
      <Route path="/reports/blocked">
        {() => <ProtectedRoute component={BlockedContacts} />}
      </Route>
      <Route path="/reports/contacts">
        {() => <ProtectedRoute component={ContactReports} />}
      </Route>
      <Route path="/reports/lead-assignments">
        {() => <ProtectedRoute component={LeadAssignmentReports} />}
      </Route>
      <Route path="/reports/user-activity">
        {() => <ProtectedRoute component={UserActivityReports} />}
      </Route>

      <Route path="/contacts">
        {() => <ProtectedRoute component={Contacts} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} />}
      </Route>

      <Route path="/usagedashboard">
        {() => <ProtectedRoute component={AiUsageDashboard} />}
      </Route>


      <Route path="/report-dripcampaign">
        {() => <ProtectedRoute component={DripCampaignReport} />}
      </Route>
      <Route path="/reports/whatsapp-flows">
        {() => <ProtectedRoute component={WhatsAppFlowReport} />}
      </Route>

      <Route path="/contactusagedashboard">
        {() => <ProtectedRoute component={ContactUsageDetail} />}
      </Route>
      <Route path="/settings/profile">
        {() => <ProtectedRoute component={ProfileDetails} />}
      </Route>
      <Route path="/settings/api">
        {() => <ProtectedRoute component={WebhookAPI} />}
      </Route>
      <Route path="/settings/webhook-events">
        {() => <ProtectedRoute component={WebhookEvents} />}
      </Route>

      {/* User Management */}
      <Route path="/user-management">
        {() => <ProtectedRoute component={UserManagement} />}
      </Route>

      <Route path="/user-management-dashboard">
        {() => <ProtectedRoute component={UserManagementDashboard} />}
      </Route>

      <Route path="/fblead-automation-report">
        {() => <ProtectedRoute component={FBLeadAutomationReport} />}
      </Route>

      <Route path="/campaigns/past">
        {() => <ProtectedRoute component={Single} />}
      </Route>

      <Route path="/register">
        {isLoading ? null : isAuthenticated ? <Redirect to="/" /> : <Register />}
      </Route>
      <Route component={NotFound} />
    </Switch >
  );
}

function MainApp() {
  const [location] = useLocation();
  const isAuthRoute = [
    "/login", 
    "/forgot-password", 
    "/reset-password", 
    "/launch/sellerslogin", 
    "/register"
  ].includes(location);

  if (isAuthRoute) {
    return <Router />;
  }

  return (
    <DashboardLayout>
      <Router />
    </DashboardLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <WouterRouter base="/whatsapp-marketing">
            <div className="whatsapp-marketing-app min-h-screen w-full">
              <Suspense
                fallback={
                  <div className="flex min-h-[50vh] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                }
              >
                <MainApp />
              </Suspense>
            </div>
          </WouterRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
