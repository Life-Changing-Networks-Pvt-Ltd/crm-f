// @ts-nocheck
// src/components/layout/SidebarNav.tsx
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders, useAuth } from "@whatsapp/contexts/AuthContext";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BarChart3,
  Bot,
  ChevronDown,
  ChevronRight,
  Clock,
  PanelsTopLeft as Facebook,
  FileText,
  Gauge,
  GitBranch,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  Workflow,
  Settings,
  User,
  UserCog,
  Users,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./ui/sidebar";
import { isAdminUser, isSystemScopedUser } from "@whatsapp/lib/accessControl";

interface Chat {
  id: string;
  lastInboundMessageTime?: string;
  unreadCount: number;
}

interface NavSubItem {
  label: string;
  href: string;
  accessIds?: string[];
}

interface NavItemConfig {
  icon: LucideIcon;
  label: string;
  href: string;
  pageId?: string;
  accessIds?: string[];
  exact?: boolean;
  badge?: number;
  adminOnly?: boolean;
  subItems?: NavSubItem[];
}

interface SidebarUser {
  id: string;
  name: string;
  username?: string;
  email?: string;
  role: string;
  pageAccess?: string[];
}

const AUTH_USER_KEY = "whatsapp_auth_user";
const SIDEBAR_SCROLL_TOP_KEY = "app-sidebar-scroll-top";

const normalizePath = (rawPath: string) => {
  const [path = "/"] = rawPath.split(/[?#]/);
  if (path === "/") return path;
  return path.replace(/\/+$/, "");
};

const isPathActive = (currentPath: string, targetPath: string) => {
  const current = normalizePath(currentPath);
  const target = normalizePath(targetPath);

  if (target === "/") return current === "/";
  if (current === target) return true;
  return current.startsWith(`${target}/`);
};

const getNavItemKey = (item: NavItemConfig) =>
  [item.pageId, item.label, item.href].filter(Boolean).join("::");

const isGroupActive = (location: string, item: NavItemConfig) => {
  if (!item.subItems || item.subItems.length === 0) return false;
  const current = normalizePath(location);
  const directMatch = current === normalizePath(item.href);
  if (directMatch) return true;
  return item.subItems.some((sub) => isPathActive(location, sub.href));
};

const isLeafActive = (location: string, item: NavItemConfig) =>
  item.exact ? normalizePath(location) === normalizePath(item.href) : isPathActive(location, item.href);

export default function SidebarNav() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const sidebarContentId = useId();
  const isSystemUser = isSystemScopedUser(user);
  const isAdmin = isAdminUser(user);

  const [openSectionKeys, setOpenSectionKeys] = useState<string[]>([]);

  const { data: users = [], isLoading: usersLoading } = useQuery<SidebarUser[]>({
    queryKey: ["sidebar-switch-users", user?.id],
    enabled: isAdmin,
    queryFn: async () => {
      const res = await fetch("/api/users/all", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const switchableUsers = useMemo<SidebarUser[]>(() => {
    const byId = new Map<string, SidebarUser>();

    if (user?.id) {
      byId.set(user.id, {
        id: user.id,
        username: user.username,
        name: user.name || user.username || "User",
        email: user.email,
        role: user.role || "user",
        pageAccess: user.pageAccess || [],
      });
    }

    for (const currentUser of users) {
      if (!currentUser?.id) continue;
      byId.set(currentUser.id, currentUser);
    }

    return Array.from(byId.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }, [user, users]);

  const { data: windowUnreadCount = 0 } = useQuery<number>({
    queryKey: ["/api/chats", "window-unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/chats", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return 0;

      const allChats: Chat[] = await res.json();
      const now = new Date();
      let totalUnread = 0;

      for (const chat of allChats) {
        if (chat.unreadCount <= 0 || !chat.lastInboundMessageTime) continue;

        const lastInbound = new Date(chat.lastInboundMessageTime);
        const hoursDiff =
          (now.getTime() - lastInbound.getTime()) / (1000 * 60 * 60);

        if (hoursDiff <= 24) {
          totalUnread += chat.unreadCount;
        }
      }

      return totalUnread;
    },
    refetchInterval: 10000,
  });

  const navStructure = useMemo<NavItemConfig[]>(
    () => [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/",
        pageId: "dashboard",
      },
      {
        icon: Clock,
        label: "24-Hour Window",
        href: "/inbox/window",
        pageId: "window-inbox",
        badge: windowUnreadCount > 0 ? windowUnreadCount : undefined,
      },
      {
        icon: MessageSquare,
        label: "Inbox",
        href: "/inbox",
        pageId: "inbox",
        exact: true,
      },
      {
        icon: Workflow,
        label: "WhatsApp Flows",
        href: "/whatsapp-flows",
        pageId: "flow-builder",
      },
      {
        icon: Megaphone,
        label: "Campaigns",
        href: "/campaigns",
        pageId: "broadcast",
        subItems: [
          { label: "Broadcasts", href: "/campaigns/broadcast" },
          { label: "Single Messages", href: "/campaigns/past" },
        ],
      },
      {
        icon: GitBranch,
        label: "Automation",
        href: "/automation/dashboard",
        pageId: "auto-reply",
        subItems: [
          { label: "Facebook Lead Automation", href: "/automation/triggers" },
          { label: "Drip Campaigns", href: "/automation/campaigns" },
          { label: "Interest Lists", href: "/automation/interest" },
        ],
      },
      // {
      //   icon: LayoutGrid,
      //   label: "Connect Apps",
      //   href: "/apps/connect",
      //   pageId: "flow-builder",
      // },
      {
        icon: FileText,
        label: "Templates",
        href: "/templates",
        pageId: "templates",
        subItems: [
          { label: "Add Template", href: "/templates/add" },
          { label: "Manage Templates", href: "/templates/manage" },
        ],
      },
      {
        icon: Gauge,
        label: "Usage",
        href: "/usage/messages",
        subItems: [
          { label: "Message Usage", href: "/usage/messages" },
          { label: "Template Usage", href: "/usage/templates" },
          { label: "Pricing Usage", href: "/usage/pricing" },
        ],
      },

      {
        icon: Bot,
        label: "AI Agent",
        href: "/ai",
        pageId: "ai-agents",
        subItems: [
          { label: "All Agents", href: "/ai/agents" },
          { label: "New Agent", href: "/ai/new" },
          { label: "Pre-filled Text", href: "/ai/prefilled" },
        ],
      },
      {
        icon: Facebook,
        label: "Facebook",
        href: "/facebook",
        pageId: "facebook-leads",
        subItems: [{ label: "Lead Forms", href: "/facebook/forms" }],
      },
      {
        icon: BarChart3,
        label: "Reports",
        href: "/reports",
        pageId: "reports-campaign",
        accessIds: ["reports-campaign", "reports-blocked", "reports-engagement"],
        subItems: [
          {
            label: "Broadcast Report",
            href: "/reports/broadcast",
            accessIds: ["reports-campaign"],
          },
          {
            label: "Single Message Report",
            href: "/reports/single-messages",
            accessIds: ["reports-campaign"],
          },
          {
            label: "Schedule Messages",
            href: "/campaigns/schedule",
            accessIds: ["reports-campaign"],
          },
          {
            label: "Agent Perf.",
            href: "/reports/agents",
            accessIds: ["reports-campaign"],
          },
          {
            label: "Contact Analytics",
            href: "/reports/contacts",
            accessIds: ["reports-campaign"],
          },
          {
            label: "Lead Assignments",
            href: "/reports/lead-assignments",
            accessIds: ["reports-campaign"],
          },
          {
            label: "Team Member Report",
            href: "/reports/user-activity",
            accessIds: ["reports-campaign"],
          },
          {
            label: "Blocked Contacts",
            href: "/reports/blocked",
            accessIds: ["reports-blocked"],
          },
          {
            label: "Drip Campaigns Report",
            href: "/report-dripcampaign",
            accessIds: ["reports-campaign"],
          },
          {
            label: "WhatsApp Flow Report",
            href: "/reports/whatsapp-flows",
            accessIds: ["reports-campaign"],
          },
          {
            label: "Fb Lead Automation Report",
            href: "/fblead-automation-report",
            accessIds: ["reports-campaign"],
          },
          {
            label: "User Engagement",
            href: "/reports/user-engagement",
            accessIds: ["reports-engagement"],
          },
        ],
      },
      {
        icon: Users,
        label: "Contacts",
        href: "/contacts",
        pageId: "contacts",
      },
      {
        icon: UserCog,
        label: "User Management",
        href: "/user-management",
        pageId: "user-management",
        adminOnly: true,
      },
      {
        icon: Settings,
        label: "Settings",
        href: "/settings",
        pageId: "settings",
        subItems: [
          { label: "Profile Details", href: "/settings/profile" },
          // { label: "Webhook & API", href: "/settings/api" },
          // { label: "Webhook Events", href: "/settings/webhook-events" },
        ],
      },
    ],
    [windowUnreadCount]
  );

  const pageAccessSet = useMemo(() => new Set(user?.pageAccess ?? []), [user]);

  const hasAnyAccess = useCallback((accessIds?: string[], allowWhenMissing = true) => {
    if (!accessIds || accessIds.length === 0) return allowWhenMissing;
    return accessIds.some((id) => pageAccessSet.has(id));
  }, [pageAccessSet]);

  const filteredNavStructure = useMemo(() => {
    return navStructure
      .filter((item) => {
        if (item.adminOnly && !isAdmin) return false;
        if (!isSystemUser) return true;

        const hasDirectPageAccess = item.pageId
          ? pageAccessSet.has(item.pageId)
          : false;
        const hasGroupedAccess = hasAnyAccess(item.accessIds, false);

        if (!item.pageId && !item.accessIds) return true;
        return hasDirectPageAccess || hasGroupedAccess;
      })
      .map((item) => {
        if (!isSystemUser || !item.subItems) return item;

        const visibleSubItems = item.subItems.filter((sub) =>
          hasAnyAccess(sub.accessIds, true)
        );

        return {
          ...item,
          subItems: visibleSubItems,
        };
      })
      .filter((item) => !item.subItems || item.subItems.length > 0);
  }, [hasAnyAccess, isAdmin, isSystemUser, navStructure, pageAccessSet]);

  useEffect(() => {
    const activeGroupKeys = filteredNavStructure
      .filter((item) => isGroupActive(location, item))
      .map((item) => getNavItemKey(item));
    if (activeGroupKeys.length === 0) return;

    setOpenSectionKeys((prev) => Array.from(new Set([...prev, ...activeGroupKeys])));
  }, [filteredNavStructure, location]);

  useEffect(() => {
    const saved = Number(sessionStorage.getItem(SIDEBAR_SCROLL_TOP_KEY) || 0);
    if (!saved) return;

    const raf = requestAnimationFrame(() => {
      const sidebarContent = document.getElementById(sidebarContentId);
      if (sidebarContent) {
        sidebarContent.scrollTop = saved;
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [location, sidebarContentId]);

  const persistScroll = (scrollTop: number) => {
    sessionStorage.setItem(SIDEBAR_SCROLL_TOP_KEY, String(scrollTop));
  };

  const handleGroupToggle = (item: NavItemConfig) => {
    const key = getNavItemKey(item);
    setOpenSectionKeys((prev) =>
      prev.includes(key) ? prev.filter((value) => value !== key) : [...prev, key]
    );
  };

  const handleNavigate = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    parentKey?: string
  ) => {
    const isSpecialClick =
      event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1;

    if (isSpecialClick) return;

    event.preventDefault();
    const sidebarContent = document.getElementById(sidebarContentId);
    if (sidebarContent) {
      persistScroll(sidebarContent.scrollTop);
    }

    if (parentKey) {
      setOpenSectionKeys((prev) =>
        prev.includes(parentKey) ? prev : [...prev, parentKey]
      );
    }

    if (normalizePath(location) !== normalizePath(href)) {
      navigate(href);
    }
  };

  return (
    <>
      <SidebarHeader className="gap-0 p-0">
        <div className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg leading-none tracking-tight text-black">
              WhatsApp
            </h1>
            <span className="text-xs text-black/70">Business API</span>
          </div>
        </div>

        <div className="px-3 pb-3">
          {isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center border border-black/30 justify-between text-black hover:bg-black/5"
                >
                  <User className="h-4 w-4" />
                  <span className="truncate">{user?.name || "Admin"}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 border border-black/20">
                {usersLoading && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Loading users...
                  </div>
                )}

                {switchableUsers.map((currentUser) => (
                  <DropdownMenuItem
                    key={currentUser.id}
                    onClick={() => {
                      if (currentUser.id === user?.id) return;

                      sessionStorage.setItem(
                        AUTH_USER_KEY,
                        JSON.stringify({
                          id: currentUser.id,
                          username:
                            currentUser.username ||
                            currentUser.email ||
                            currentUser.name ||
                            "user",
                          name:
                            currentUser.name ||
                            currentUser.username ||
                            "User",
                          email: currentUser.email || "",
                          role: currentUser.role || "user",
                          pageAccess: currentUser.pageAccess || [],
                        })
                      );
                      window.location.reload();
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{currentUser.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {currentUser.email || currentUser.username || ""}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center border border-black/30 justify-start gap-2 text-black hover:bg-black/5"
              disabled
            >
              <User className="h-4 w-4" />
              <span className="truncate">{user?.email || "Email unavailable"}</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => {
              window.location.href = "/";
            }}
            className="w-full mt-3 gap-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-500 dark:hover:bg-emerald-950/30 h-9 px-3 text-sm font-semibold rounded-md shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent
        id={sidebarContentId}
        onScroll={(event) => persistScroll(event.currentTarget.scrollTop)}
        className="px-2 pb-2"
      >
        <SidebarMenu>
          {filteredNavStructure.map((item) => {
            const itemKey = getNavItemKey(item);
            const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
            const isOpen = openSectionKeys.includes(itemKey);
            const active = hasSubItems
              ? isGroupActive(location, item)
              : isLeafActive(location, item);

            if (hasSubItems) {
              return (
                <SidebarMenuItem key={itemKey}>
                  <SidebarMenuButton
                    type="button"
                    isActive={active}
                    onClick={() => handleGroupToggle(item)}
                    className="text-black hover:bg-black/10 hover:text-black data-[active=true]:bg-slate-700 data-[active=true]:text-white data-[active=true]:[&_svg]:text-white data-[active=true]:[&_span]:text-white justify-between"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    {isOpen ? (
                      <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
                    ) : (
                      <ChevronRight className="h-3 w-3 shrink-0 opacity-70" />
                    )}
                  </SidebarMenuButton>

                  {isOpen && (
                    <SidebarMenuSub>
                      {item.subItems?.map((sub) => (
                        <SidebarMenuSubItem key={sub.href}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isPathActive(location, sub.href)}
                            className="text-black hover:bg-black/10 hover:text-black data-[active=true]:bg-slate-800 data-[active=true]:text-white data-[active=true]:[&_span]:text-white"
                          >
                            <a
                              href={sub.href}
                              onClick={(event) =>
                                handleNavigate(event, sub.href, itemKey)
                              }
                            >
                              <span>{sub.label}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              );
            }

            return (
              <SidebarMenuItem key={itemKey}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className="text-black hover:bg-black/10 hover:text-black data-[active=true]:bg-slate-800 data-[active=true]:text-white data-[active=true]:[&_svg]:text-white data-[active=true]:[&_span]:text-white"
                >
                  <a href={item.href} onClick={(event) => handleNavigate(event, item.href)}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
                {item.badge ? (
                  <SidebarMenuBadge className="text-red-700 font-semibold">
                    {item.badge > 99 ? "99+" : item.badge}
                  </SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

    </>
  );
}
