// @ts-nocheck
export interface AccessControlUser {
  role?: string;
  pageAccess?: string[];
}

type RouteRule = {
  path: string;
  accessIds?: string[];
  adminOnly?: boolean;
  exact?: boolean;
};

const ADMIN_ROLES = new Set(["super_admin", "sub_admin"]);

const ROUTE_RULES: RouteRule[] = [
  {
    path: "/user-management-dashboard",
    accessIds: ["user-management"],
    adminOnly: true,
  },
  {
    path: "/user-management",
    accessIds: ["user-management"],
    adminOnly: true,
  },
  { path: "/inbox/window", accessIds: ["window-inbox"] },
  { path: "/inbox/leads", accessIds: ["inbox"] },
  { path: "/inbox", accessIds: ["inbox"] },
  { path: "/campaigns", accessIds: ["broadcast"] },
  { path: "/automation", accessIds: ["auto-reply"] },
  { path: "/apps/connect", accessIds: ["flow-builder"] },
  { path: "/templates", accessIds: ["templates"] },
  { path: "/ai", accessIds: ["ai-agents"] },
  { path: "/facebook", accessIds: ["facebook-leads"] },
  { path: "/reports/blocked", accessIds: ["reports-blocked"] },
  { path: "/reports/user-engagement", accessIds: ["reports-engagement"] },
  {
    path: "/reports",
    accessIds: ["reports-campaign", "reports-blocked", "reports-engagement"],
  },
  { path: "/fblead-automation-report", accessIds: ["reports-campaign"] },
  { path: "/report-dripcampaign", accessIds: ["reports-campaign"] },
  { path: "/reports/whatsapp-flows", accessIds: ["reports-campaign"] },
  { path: "/contacts", accessIds: ["contacts"] },
  { path: "/settings", accessIds: ["settings"] },
  { path: "/usagedashboard", accessIds: ["settings"] },
  { path: "/contactusagedashboard", accessIds: ["settings"] },
  { path: "/", accessIds: ["dashboard"], exact: true },
];

const FALLBACK_PATHS = [
  "/",
  "/inbox/window",
  "/inbox",
  "/campaigns",
  "/automation/dashboard",
  "/apps/connect",
  "/templates",
  "/ai/agents",
  "/facebook/forms",
  "/reports/broadcast",
  "/contacts",
  "/settings/profile",
] as const;

function normalizePath(path: string): string {
  const [pathname = "/"] = path.split(/[?#]/);
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "");
}

function matchesRoute(path: string, rule: RouteRule): boolean {
  const current = normalizePath(path);
  const target = normalizePath(rule.path);

  if (rule.exact) {
    return current === target;
  }

  return current === target || current.startsWith(`${target}/`);
}

function getMatchingRule(path: string): RouteRule | undefined {
  return ROUTE_RULES.find((rule) => matchesRoute(path, rule));
}

export function isAdminUser(user: AccessControlUser | null | undefined): boolean {
  return ADMIN_ROLES.has(user?.role || "");
}

export function isSystemScopedUser(
  user: AccessControlUser | null | undefined
): boolean {
  return Array.isArray(user?.pageAccess) && user.pageAccess.length > 0;
}

export function canAccessPath(
  user: AccessControlUser | null | undefined,
  path: string
): boolean {
  const rule = getMatchingRule(path);
  if (!rule) return true;

  if (rule.adminOnly && !isAdminUser(user)) {
    return false;
  }

  if (!isSystemScopedUser(user)) {
    return true;
  }

  if (!rule.accessIds || rule.accessIds.length === 0) {
    return true;
  }

  const pageAccessSet = new Set(user?.pageAccess || []);
  return rule.accessIds.some((accessId) => pageAccessSet.has(accessId));
}

export function getFirstAccessiblePath(
  user: AccessControlUser | null | undefined
): string {
  for (const path of FALLBACK_PATHS) {
    if (canAccessPath(user, path)) {
      return path;
    }
  }

  return "/";
}

export function normalizeAccessPath(path: string): string {
  return normalizePath(path);
}
