import { createRootRouteWithContext, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import { AppShell } from '../components/layout/AppShell';

// Import all pages
import Leads from '../pages/Leads';
import Customers from '../pages/Customers';
import Companies from '../pages/Companies';
import CreateCompany from '../pages/CreateCompany';
import EditCompany from '../pages/EditCompany';
import CreateCustomer from '../pages/CreateCustomer';
import EditCustomer from '../pages/EditCustomer';
import Contacts from '../pages/Contacts';
import Deals from '../pages/Deals';
import Pipeline from '../pages/Pipeline';
import Quotes from '../pages/Quotes';
import Invoices from '../pages/Invoices';
import Campaigns from '../pages/Campaigns';
import EmailMarketing from '../pages/EmailMarketing';
import WhatsAppCampaigns from '../pages/WhatsAppCampaigns';
import LandingPages from '../pages/LandingPages';
import Messages from '../pages/Messages';
import EmailInbox from '../pages/EmailInbox';
import Calls from '../pages/Calls';
import Meetings from '../pages/Meetings';
import Tasks from '../pages/Tasks';
import Calendar from '../pages/Calendar';
import Notes from '../pages/Notes';
import Activities from '../pages/Activities';
import DashboardReports from '../pages/DashboardReports';
import SalesReports from '../pages/SalesReports';
import MarketingReports from '../pages/MarketingReports';
import UserReports from '../pages/UserReports';
import Users from '../pages/Users';
import Roles from '../pages/Roles';
import PageAccess from '../pages/PageAccess';
import Teams from '../pages/Teams';
import Settings from '../pages/Settings';
import Profile from '../pages/Profile';
import Notifications from '../pages/Notifications';
import Integrations from '../pages/Integrations';
import AuditLogs from '../pages/AuditLogs';

// Define context to pass to router
export interface MyRouterContext {
  auth: {
    isAuthenticated: boolean;
  };
}

// Root route
export const rootRoute = createRootRouteWithContext<MyRouterContext>()({
  component: () => <Outlet />,
});

// Login route
export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: '/',
      });
    }
  },
});

// Protected root layout route using AppShell
export const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: () => <AppShell />,
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
      });
    }
  },
});

// Dashboard route (index)
export const indexRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/',
  component: Dashboard,
});

// CRM Routes
const leadsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/leads', component: Leads });
const customersRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/customers', component: Customers });
const createCustomerRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/customers/new', component: CreateCustomer });
const editCustomerRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/customers/edit/$customerId', component: EditCustomer });
const companiesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/companies', component: Companies });
const createCompanyRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/companies/new', component: CreateCompany });
const editCompanyRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/companies/edit/$companyId', component: EditCompany });
const contactsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/contacts', component: Contacts });

// Sales Routes
const dealsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/deals', component: Deals });
const pipelineRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/pipeline', component: Pipeline });
const quotesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/quotes', component: Quotes });
const invoicesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/invoices', component: Invoices });

// Marketing Routes
const campaignsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/campaigns', component: Campaigns });
const emailMarketingRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/email-marketing', component: EmailMarketing });
const whatsappRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/whatsapp-campaigns', component: WhatsAppCampaigns });
const landingPagesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/landing-pages', component: LandingPages });

// Communication Routes
const messagesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/messages', component: Messages });
const emailInboxRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/email-inbox', component: EmailInbox });
const callsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/calls', component: Calls });
const meetingsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/meetings', component: Meetings });

// Tasks Routes
const tasksRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/tasks', component: Tasks });
const calendarRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/calendar', component: Calendar });
const notesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/notes', component: Notes });
const activitiesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/activities', component: Activities });

// Reports Routes
const reportsDashboardRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/reports/dashboard', component: DashboardReports });
const reportsSalesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/reports/sales', component: SalesReports });
const reportsMarketingRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/reports/marketing', component: MarketingReports });
const reportsUsersRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/reports/users', component: UserReports });

// Administration Routes
const usersRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/users', component: Users });
const rolesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/roles', component: Roles });
const pageAccessRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/page-access', component: PageAccess });
const teamsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/teams', component: Teams });
const settingsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/settings', component: Settings });

// System Routes
const profileRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/profile', component: Profile });
const notificationsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/notifications', component: Notifications });
const integrationsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/integrations', component: Integrations });
const auditLogsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/audit-logs', component: AuditLogs });

const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedRoute.addChildren([
    indexRoute,
    leadsRoute,
    customersRoute,
    createCustomerRoute,
    editCustomerRoute,
    companiesRoute,
    createCompanyRoute,
    editCompanyRoute,
    contactsRoute,
    dealsRoute,
    pipelineRoute,
    quotesRoute,
    invoicesRoute,
    campaignsRoute,
    emailMarketingRoute,
    whatsappRoute,
    landingPagesRoute,
    messagesRoute,
    emailInboxRoute,
    callsRoute,
    meetingsRoute,
    tasksRoute,
    calendarRoute,
    notesRoute,
    activitiesRoute,
    reportsDashboardRoute,
    reportsSalesRoute,
    reportsMarketingRoute,
    reportsUsersRoute,
    usersRoute,
    rolesRoute,
    pageAccessRoute,
    teamsRoute,
    settingsRoute,
    profileRoute,
    notificationsRoute,
    integrationsRoute,
    auditLogsRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!, // We'll pass this in via a wrapper
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
