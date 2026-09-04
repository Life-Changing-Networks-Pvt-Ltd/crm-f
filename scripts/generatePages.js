import fs from 'fs';
import path from 'path';

const pages = [
  { name: 'Leads', desc: 'Manage your sales leads.', type: 'list' },
  { name: 'Customers', desc: 'Manage your active customers.', type: 'list' },
  { name: 'Companies', desc: 'Manage company profiles.', type: 'list' },
  { name: 'Contacts', desc: 'Manage individual contacts.', type: 'list' },
  { name: 'Deals', desc: 'Manage your sales deals.', type: 'kanban' },
  { name: 'Pipeline', desc: 'View your sales pipeline.', type: 'kanban' },
  { name: 'Quotes', desc: 'Manage sales quotes.', type: 'list' },
  { name: 'Invoices', desc: 'Manage customer invoices.', type: 'list' },
  { name: 'Campaigns', desc: 'Manage marketing campaigns.', type: 'list' },
  { name: 'EmailMarketing', desc: 'Manage email marketing.', type: 'list' },
  { name: 'WhatsAppCampaigns', desc: 'Manage WhatsApp campaigns.', type: 'list' },
  { name: 'LandingPages', desc: 'Manage landing pages.', type: 'list' },
  { name: 'Messages', desc: 'Manage internal and external messages.', type: 'list' },
  { name: 'EmailInbox', desc: 'View your connected email inbox.', type: 'list' },
  { name: 'Calls', desc: 'Log and manage calls.', type: 'list' },
  { name: 'Meetings', desc: 'Schedule and manage meetings.', type: 'calendar' },
  { name: 'Tasks', desc: 'Manage your tasks.', type: 'list' },
  { name: 'Calendar', desc: 'View your calendar.', type: 'calendar' },
  { name: 'Notes', desc: 'Manage your notes.', type: 'list' },
  { name: 'Activities', desc: 'View all activities.', type: 'list' },
  { name: 'DashboardReports', desc: 'View dashboard reports.', type: 'chart' },
  { name: 'SalesReports', desc: 'View sales reports.', type: 'chart' },
  { name: 'UserReports', desc: 'View user reports.', type: 'chart' },
  { name: 'Users', desc: 'Manage system users.', type: 'list' },
  { name: 'Roles', desc: 'Manage roles and permissions.', type: 'list' },
  { name: 'Teams', desc: 'Manage teams.', type: 'list' },
  { name: 'Settings', desc: 'Manage system settings.', type: 'tabs' },
  { name: 'Profile', desc: 'Manage your profile.', type: 'profile' },
  { name: 'Notifications', desc: 'View your notifications.', type: 'list' },
  { name: 'Integrations', desc: 'Manage system integrations.', type: 'list' },
  { name: 'AuditLogs', desc: 'View system audit logs.', type: 'list' },
];

const templateList = (name, desc) => `import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/layout/EmptyState"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function ${name}() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="${name}" description="${desc}">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </PageHeader>
      <EmptyState
        title="No ${name.toLowerCase()} found"
        description="Get started by creating a new one."
        actionLabel="Create ${name}"
        onAction={() => {}}
      />
    </div>
  )
}
`;

const templateKanban = (name, desc) => `import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function ${name}() {
  return (
    <div className="flex flex-col gap-6 h-full">
      <PageHeader title="${name}" description="${desc}">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </PageHeader>
      <div className="flex-1 min-h-[500px] flex gap-4 overflow-x-auto pb-4">
        {['To Do', 'In Progress', 'Done'].map(col => (
          <div key={col} className="w-[300px] min-w-[300px] shrink-0 bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-4">{col}</h3>
            <div className="h-24 bg-background rounded border shadow-sm mb-2"></div>
            <div className="h-24 bg-background rounded border shadow-sm"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
`;

const templateCalendar = (name, desc) => `import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function ${name}() {
  return (
    <div className="flex flex-col gap-6 h-full">
      <PageHeader title="${name}" description="${desc}">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </PageHeader>
      <div className="flex-1 min-h-[500px] border rounded-lg bg-card flex items-center justify-center text-muted-foreground">
        Calendar View Placeholder
      </div>
    </div>
  )
}
`;

const templateChart = (name, desc) => `import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ${name}() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="${name}" description="${desc}" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">Chart Placeholder</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">Chart Placeholder</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
`;

const templateTabs = (name, desc) => `import { PageHeader } from "@/components/layout/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ${name}() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="${name}" description="${desc}" />
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Update your general settings here.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">Form Placeholder</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
            </CardHeader>
            <CardContent>Company form placeholder</CardContent>
          </Card>
        </TabsContent>
        {/* Other tabs omitted for brevity */}
      </Tabs>
    </div>
  )
}
`;

const templateProfile = (name, desc) => `import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ${name}() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="${name}" description="${desc}" />
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src="/avatars/01.png" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-medium">John Doe</h3>
            <p className="text-sm text-muted-foreground">Admin</p>
          </CardContent>
        </Card>
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">Form Placeholder</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="h-[150px] flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">Form Placeholder</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
`;

const getTemplate = (type) => {
  if (type === 'kanban') return templateKanban;
  if (type === 'calendar') return templateCalendar;
  if (type === 'chart') return templateChart;
  if (type === 'tabs') return templateTabs;
  if (type === 'profile') return templateProfile;
  return templateList;
};

const pagesDir = path.join(process.cwd(), 'src', 'pages');

pages.forEach(p => {
  const content = getTemplate(p.type)(p.name, p.desc);
  fs.writeFileSync(path.join(pagesDir, p.name + '.tsx'), content);
  console.log('Created ' + p.name + '.tsx');
});
