// @ts-nocheck
// src/components/layout/DashboardLayout.tsx
import { createContext, useContext } from "react";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@whatsapp/contexts/AuthContext";
import { Sidebar, SidebarInset, SidebarProvider } from "@whatsapp/components/ui/sidebar";
import {
  canAccessPath,
  getFirstAccessiblePath,
  normalizeAccessPath,
} from "@whatsapp/lib/accessControl";

import SidebarNav from "../SidebarNav";
import Header from "../Header";

export const DashboardLayoutContext = createContext(false);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isNested = useContext(DashboardLayoutContext);
  const { user } = useAuth();
  const [location] = useLocation();

  if (isNested) {
    return <>{children}</>;
  }

  if (!canAccessPath(user, location)) {
    const fallbackPath = getFirstAccessiblePath(user);
    if (normalizeAccessPath(fallbackPath) !== normalizeAccessPath(location)) {
      return <Redirect to={fallbackPath} />;
    }
    return null;
  }

  return (
    <DashboardLayoutContext.Provider value={true}>
      <SidebarProvider defaultOpen>
        <Sidebar className="bg-[#9fadcc] text-black border-r border-sidebar-border">
          <SidebarNav />
        </Sidebar>

        <SidebarInset className="h-screen overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </DashboardLayoutContext.Provider>
  );
}
