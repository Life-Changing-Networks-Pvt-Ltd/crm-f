import { createRootRouteWithContext, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import { AppShell } from '../components/layout/AppShell';
import { lazyPage } from '../components/layout/lazyPage';

const Leads = lazyPage(() => import('../pages/Leads'));
const AllLeads = lazyPage(() => import('../pages/AllLeads'));
const UnifiedLeadDetails = lazyPage(() => import('../pages/UnifiedLeadDetails'));
const Employees = lazyPage(() => import('../pages/Employees'));
const CreateEmployee = lazyPage(() => import('../pages/CreateEmployee'));
const EditEmployee = lazyPage(() => import('../pages/EditEmployee'));
const CreateCompany = lazyPage(() => import('../pages/CreateCompany'));
const EditCompany = lazyPage(() => import('../pages/EditCompany'));
const Campaigns = lazyPage(() => import('../pages/Campaigns'));
const EmailMarketing = lazyPage(() => import('../pages/EmailMarketing'));
const WhatsAppMarketingModule = lazyPage(() => import('../pages/WhatsAppMarketingModule'));
const Messages = lazyPage(() => import('../pages/Messages'));
const EmailInbox = lazyPage(() => import('../pages/EmailInbox'));
const Meetings = lazyPage(() => import('../pages/Meetings'));
const Settings = lazyPage(() => import('../pages/Settings'));
const Attendance = lazyPage(() => import('../pages/Attendance'));
const Tasks = lazyPage(() => import('../pages/Tasks'));
const Calendar = lazyPage(() => import('../pages/Calendar'));
const Notes = lazyPage(() => import('../pages/Notes'));
const DashboardReports = lazyPage(() => import('../pages/DashboardReports'));
const SalesReports = lazyPage(() => import('../pages/SalesReports'));
const MarketingReports = lazyPage(() => import('../pages/MarketingReports'));
const UserReports = lazyPage(() => import('../pages/UserReports'));
const MeetingReports = lazyPage(() => import('../pages/MeetingReports'));
const AttendanceReports = lazyPage(() => import('../pages/AttendanceReports'));
const Users = lazyPage(() => import('../pages/Users'));
const Roles = lazyPage(() => import('../pages/Roles'));
const PageAccess = lazyPage(() => import('../pages/PageAccess'));
const Teams = lazyPage(() => import('../pages/Teams'));
const Profile = lazyPage(() => import('../pages/Profile'));
const Notifications = lazyPage(() => import('../pages/Notifications'));
const Calling = lazyPage(() => import('../pages/Calling'));
const CallHistory = lazyPage(() => import('../pages/CallHistory'));
const CallDetails = lazyPage(() => import('../pages/CallDetails'));

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
const createCompanyLeadRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/leads/new', component: CreateCompany });
const companyLeadDetailsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/leads/$id', component: UnifiedLeadDetails });
const editCompanyLeadRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/leads/$id/edit', component: EditCompany });
const allLeadsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/leads/all', component: AllLeads });
const unifiedLeadDetailsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/leads/all/$type/$id', component: UnifiedLeadDetails });
const employeesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/employees', component: Employees });
const createEmployeeRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/employees/new', component: CreateEmployee });
const editEmployeeRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/employees/edit/$employeeId', component: EditEmployee });
const companiesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/companies',
  beforeLoad: () => { throw redirect({ to: '/leads' }); },
});
const createCompanyRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/companies/new',
  beforeLoad: () => { throw redirect({ to: '/leads/new' }); },
});
const editCompanyRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/companies/edit/$companyId',
  beforeLoad: ({ params }) => { throw redirect({ to: '/leads/$id/edit', params: { id: params.companyId } }); },
});



// Marketing Routes
const campaignsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/campaigns', component: Campaigns });
const requireAuthentication = ({ context }: { context: MyRouterContext }) => {
  if (!context.auth.isAuthenticated) throw redirect({ to: '/login' });
};
const emailMarketingRoute = createRoute({ getParentRoute: () => rootRoute, path: '/email-marketing', component: EmailMarketing, beforeLoad: requireAuthentication });
const emailMarketingWildcardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/email-marketing/$', component: EmailMarketing, beforeLoad: requireAuthentication });
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
  emailMarketingRoute,
  emailMarketingWildcardRoute,
  whatsappRoute,
  whatsappWildcardRoute,
  legacyWhatsappRoute,
  protectedRoute.addChildren([
    indexRoute,
    leadsRoute,
    createCompanyLeadRoute,
    companyLeadDetailsRoute,
    editCompanyLeadRoute,
    allLeadsRoute,
    unifiedLeadDetailsRoute,
    employeesRoute,
    createEmployeeRoute,
    editEmployeeRoute,
    companiesRoute,
    createCompanyRoute,
    editCompanyRoute,

    campaignsRoute,
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
