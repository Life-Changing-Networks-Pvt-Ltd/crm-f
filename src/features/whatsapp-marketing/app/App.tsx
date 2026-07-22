// @ts-nocheck
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
import NotFound from "@whatsapp/pages/not-found";
import Login from "@whatsapp/pages/Login";
import ForgotPassword from "@whatsapp/pages/ForgotPassword";
import ResetPassword from "@whatsapp/pages/ResetPassword";
import SellersLoginLaunch from "@whatsapp/pages/SellersLoginLaunch";
import WhatsAppAccountSetup from "@whatsapp/pages/WhatsAppAccountSetup";
import Dashboard from "@whatsapp/pages/dashboard";
import Inbox from "@whatsapp/pages/inbox";
import WindowInbox from "@whatsapp/pages/inbox/WindowInbox";
import WhatsAppLeads from "@whatsapp/pages/inbox/WhatsAppLeads";
import Campaigns from "@whatsapp/pages/campaigns";
import Automation from "@whatsapp/pages/automation";
import Contacts from "@whatsapp/pages/contacts";
import Settings from "@whatsapp/pages/settings";
import TeamMembers from "@whatsapp/pages/settings/TeamMembers";
import Permissions from "@whatsapp/pages/settings/Permissions";
import WhatsAppNumber from "@whatsapp/pages/settings/WhatsAppNumber";
import ProfileDetails from "@whatsapp/pages/settings/ProfileDetails";
import WebhookAPI from "@whatsapp/pages/settings/WebhookAPI";
import WebhookEvents from "@whatsapp/pages/settings/WebhookEvents";

import Templates from "@whatsapp/pages/templates";

// New Imports
import Broadcast from "@whatsapp/pages/campaigns/Broadcast";
import SelectedContacts from "@whatsapp/pages/campaigns/SelectedContacts";
import Schedule from "@whatsapp/pages/campaigns/Schedule";
import Single from "@whatsapp/pages/campaigns/Single";
import Report from "@whatsapp/pages/campaigns/Report";
import CampaignPage from "@whatsapp/pages/campaigns/CampaignPage";

import AutoLeads from "@whatsapp/pages/automation/AutoLeads";
import Keywords from "@whatsapp/pages/automation/Keywords";
import FollowUp from "@whatsapp/pages/automation/FollowUp";
import Drip from "@whatsapp/pages/automation/Drip";
import NewLeads from "@whatsapp/pages/automation/NewLeads";
import AutomationDashboard from "@whatsapp/pages/automation/AutomationDashboard";
import TriggersPage from "@whatsapp/pages/automation/TriggersPage";
import FlowsPage from "@whatsapp/pages/automation/FlowsPage";
import FlowEditor from "@whatsapp/pages/automation/FlowEditor";
import CampaignsPage from "@whatsapp/pages/automation/CampaignsPage";
import SegmentsPage from "@whatsapp/pages/automation/SegmentsPage";
import AnalyticsPage from "@whatsapp/pages/automation/AnalyticsPage";
import InterestLists from "@whatsapp/pages/automation/InterestLists";

import ConnectApps from "@whatsapp/pages/apps/ConnectApps";

import AddTemplate from "@whatsapp/pages/templates/AddTemplate";
import TemplateStatus from "@whatsapp/pages/templates/TemplateStatus";
import ManageTemplates from "@whatsapp/pages/templates/ManageTemplates";

import NewAgent from "@whatsapp/pages/ai/NewAgent";
import ManageAgents from "@whatsapp/pages/ai/ManageAgents";
import AgentsPage from "@whatsapp/pages/ai/AgentsPage";
import MapAgent from "@whatsapp/pages/ai/MapAgent";
import AgentReports from "@whatsapp/pages/ai/AgentReports";
import PrefilledTextMappings from "@whatsapp/pages/ai/PrefilledTextMappings";

import LeadForms from "@whatsapp/pages/facebook/LeadForms";
import Leads from "@whatsapp/pages/facebook/Leads";

import DeliveryReport from "@whatsapp/pages/reports/DeliveryReport";
import CampaignPerformance from "@whatsapp/pages/reports/CampaignPerformance";
import CustomerReplies from "@whatsapp/pages/reports/CustomerReplies";
import AgentPerformance from "@whatsapp/pages/reports/AgentPerformance";
import Credits from "@whatsapp/pages/reports/Credits";
import UserEngagement from "@whatsapp/pages/reports/UserEngagement";
import BroadcastReports from "@whatsapp/pages/reports/BroadcastReports";
import SingleMessageReports from "@whatsapp/pages/SingleMessageReports";
import BlockedContacts from "@whatsapp/pages/reports/BlockedContacts";
import ContactReports from "@whatsapp/pages/reports/ContactReports";
import UserManagement from "@whatsapp/pages/UserManagement";
import LeadAssignmentReports from "@whatsapp/pages/lead-assignment-reports";
import UserActivityReports from "@whatsapp/pages/user-activity-reports";
import ContactUsageDetail from "./pages/ContactUsageDetails";
import AiUsageDashboard from "./pages/AiUsageDashboard";
import UserManagementDashboard from "./pages/UserManagementDashboard";
import Register from "./pages/Register";
import FBLeadAutomationReport from "./pages/FbleadsReport";
import DripCampaignReport from "./pages/DripCampaignReport";
import WhatsAppFlowReport from "./pages/WhatsAppFlowReport";
import MessageUsage from "./pages/usage/MessageUsage";
import TemplateUsage from "./pages/usage/TemplateUsage";
import PricingUsage from "./pages/usage/PricingUsage";
import MetaFlows from "./pages/MetaFlows";

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
              <MainApp />
            </div>
          </WouterRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
