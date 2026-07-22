import { createRootRouteWithContext, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import { AppShell } from '../components/layout/AppShell';

// Import all pages
import Leads from '../pages/Leads';
import AllLeads from '../pages/AllLeads';
import UnifiedLeadDetails from '../pages/UnifiedLeadDetails';
import Employees from '../pages/Employees';
import CreateEmployee from '../pages/CreateEmployee';
import EditEmployee from '../pages/EditEmployee';
import Companies from '../pages/Companies';
import CreateCompany from '../pages/CreateCompany';
import EditCompany from '../pages/EditCompany';

import Campaigns from '../pages/Campaigns';
import EmailMarketing from '../pages/EmailMarketing';
import WhatsAppMarketingModule from '../pages/WhatsAppMarketingModule';
import Messages from '../pages/Messages';
import EmailInbox from '../pages/EmailInbox';
import Meetings from '../pages/Meetings';
import Settings from '../pages/Settings';
import Attendance from '../pages/Attendance';
import Tasks from '../pages/Tasks';
import Calendar from '../pages/Calendar';
import Notes from '../pages/Notes';
import DashboardReports from '../pages/DashboardReports';
import SalesReports from '../pages/SalesReports';
import MarketingReports from '../pages/MarketingReports';
import UserReports from '../pages/UserReports';
import MeetingReports from '../pages/MeetingReports';
import AttendanceReports from '../pages/AttendanceReports';
import Users from '../pages/Users';
import Roles from '../pages/Roles';
import PageAccess from '../pages/PageAccess';
import Teams from '../pages/Teams';
import Profile from '../pages/Profile';
import Notifications from '../pages/Notifications';
import Calling from '../pages/Calling';
import CallHistory from '../pages/CallHistory';
import CallDetails from '../pages/CallDetails';

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
const allLeadsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/leads/all', component: AllLeads });
const unifiedLeadDetailsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/leads/all/$type/$id', component: UnifiedLeadDetails });
const employeesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/employees', component: Employees });
const createEmployeeRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/employees/new', component: CreateEmployee });
const editEmployeeRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/employees/edit/$employeeId', component: EditEmployee });
const companiesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/companies', component: Companies });
const createCompanyRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/companies/new', component: CreateCompany });
const editCompanyRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/companies/edit/$companyId', component: EditCompany });



// Marketing Routes
const campaignsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/campaigns', component: Campaigns });
const emailMarketingRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/email-marketing', component: EmailMarketing });
const requireAuthentication = ({ context }: { context: MyRouterContext }) => {
  if (!context.auth.isAuthenticated) throw redirect({ to: '/login' });
};
const whatsappRoute = createRoute({ getParentRoute: () => rootRoute, path: '/whatsapp-marketing', component: WhatsAppMarketingModule, beforeLoad: requireAuthentication });
const whatsappWildcardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/whatsapp-marketing/$', component: WhatsAppMarketingModule, beforeLoad: requireAuthentication });
const legacyWhatsappRoute = createRoute({ getParentRoute: () => rootRoute, path: '/whatsapp-campaigns', beforeLoad: () => { throw redirect({ to: '/whatsapp-marketing' }); } });

// Communication Routes
const messagesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/messages', component: Messages });
const emailInboxRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/email-inbox', component: EmailInbox });
const meetingsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/meetings', component: Meetings });
const callingRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/calling', component: Calling });
const callHistoryRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/calls', component: CallHistory });
const callDetailsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/calls/$id', component: CallDetails });
const settingsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/settings', component: Settings });
const attendanceRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/attendance', component: Attendance });

// Tasks Routes
const tasksRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/tasks', component: Tasks });
const calendarRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/calendar', component: Calendar });
const notesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/notes', component: Notes });

// Reports Routes
const reportsDashboardRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/reports/dashboard', component: DashboardReports });
const reportsSalesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/reports/sales', component: SalesReports });
const reportsMarketingRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/reports/marketing', component: MarketingReports });
const reportsUsersRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/reports/users', component: UserReports });
const meetingReportsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/meeting-reports', component: MeetingReports });
const attendanceReportsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/reports/attendance', component: AttendanceReports });

// Administration Routes
const usersRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/users', component: Users });
const rolesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/roles', component: Roles });
const pageAccessRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/page-access', component: PageAccess });
const teamsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/teams', component: Teams });

// System Routes
const profileRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/profile', component: Profile });
const notificationsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/notifications', component: Notifications });

const routeTree = rootRoute.addChildren([
  loginRoute,
  whatsappRoute,
  whatsappWildcardRoute,
  legacyWhatsappRoute,
  protectedRoute.addChildren([
    indexRoute,
    leadsRoute,
    allLeadsRoute,
    unifiedLeadDetailsRoute,
    employeesRoute,
    createEmployeeRoute,
    editEmployeeRoute,
    companiesRoute,
    createCompanyRoute,
    editCompanyRoute,

    campaignsRoute,
    emailMarketingRoute,
    messagesRoute,
    emailInboxRoute,
    meetingsRoute,
    callingRoute,
    callHistoryRoute,
    callDetailsRoute,
    tasksRoute,
    calendarRoute,
    notesRoute,
    attendanceRoute,
    reportsDashboardRoute,
    reportsSalesRoute,
    reportsMarketingRoute,
    reportsUsersRoute,
    meetingReportsRoute,
    attendanceReportsRoute,
    usersRoute,
    rolesRoute,
    pageAccessRoute,
    teamsRoute,
    settingsRoute,
    profileRoute,
    notificationsRoute,
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
