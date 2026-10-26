export interface AccessUser {
  role?: string;
  permissions?: string[];
  grants?: string[];
  scopes?: Record<string, string>;
  accessVersion?: number;
}

export const PAGE_GRANTS: Record<string, string> = {
  "/": "dashboard.view",
  "/leads": "leads.view",
  "/employees": "employees.view",
  "/attendance": "attendance.view",
  "/calling": "calls.manage",
  "/calls": "calls.view",
  "/reports/dashboard": "reports.view",
  "/reports/sales": "reports.view",
  "/reports/users": "reports.view",
  "/reports/attendance": "attendance.view",
  "/email-marketing": "email.module.view",
  "/whatsapp-marketing": "whatsapp.module.view",
  "/users": "admin.users.view",
  "/roles": "admin.roles.view",
  "/page-access": "admin.roles.view",
  "/teams": "admin.teams.view",
  "/template-access": "admin.template_access.view",
  "/vendors": "admin.users.view",
  "/settings": "admin.settings.manage",
  "/audit-logs": "admin.audit.view",
};

const ADMIN_ROLES = new Set(["admin", "superadmin", "super_admin"]);

const VENDOR_DEFAULT_PERMISSIONS = new Set([
  "dashboard.view",
  "leads.view",
  "leads.create",
  "leads.edit",
  "leads.assign",
  "leads.change_status",
  "leads.add_note",
  "employees.view",
  "employees.manage",
  "admin.settings.manage",
]);

const VENDOR_ALLOWED_PAGES = new Set([
  "/",
  "/leads",
  "/employees",
  "/settings",
  "/profile",
  "/notifications",
]);

export const isAdmin = (user?: AccessUser | null) => (
  ADMIN_ROLES.has(String(user?.role || "").trim().toLowerCase())
);

export const isVendor = (user?: AccessUser | null) => (
  String(user?.role || "").trim().toLowerCase() === "vendor"
);

export const can = (user: AccessUser | null | undefined, permission: string) => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (isVendor(user) && VENDOR_DEFAULT_PERMISSIONS.has(permission)) return true;

  const grants = new Set(user.grants || []);
  if (grants.has("*") || grants.has(permission)) return true;
  const namespace = permission.split(".")[0];
  return grants.has(`${namespace}.*`);
};

export const canOpenPage = (user: AccessUser | null | undefined, path: string) => {
  if (!user) return false;
  if (isAdmin(user)) return true;

  // Strict Vendor workspace isolation
  if (isVendor(user)) {
    return VENDOR_ALLOWED_PAGES.has(path);
  }

  if (path === "/vendors") return false;
  if (
    path === "/template-access"
    && (
      can(user, "admin.template_access.view")
      || can(user, "email.templates.share")
      || can(user, "whatsapp.templates.share")
    )
  ) return true;

  const grant = PAGE_GRANTS[path];
  if (grant && can(user, grant)) return true;

  if ((user.accessVersion || 1) >= 2) return false;
  if (path === "/leads" && user.permissions?.includes("/companies")) return true;
  return Boolean(user.permissions?.includes(path));
};
