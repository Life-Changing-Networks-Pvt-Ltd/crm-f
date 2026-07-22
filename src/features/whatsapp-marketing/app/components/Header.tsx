// @ts-nocheck
// src/components/layout/Header.tsx
import { useAuth } from "@whatsapp/contexts/AuthContext";
import { getImageUrl } from "@/lib/utils";

import { Bell, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { SidebarTrigger } from "./ui/sidebar";

export default function Header() {
  const { user } = useAuth();
  const displayName = user?.name || user?.email || "User";
  const avatarSrc = getImageUrl(user?.avatar);
  const initials =
    displayName
      .split(/[\s._-]+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "U";

  return (
    <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />

        <div className="relative hidden sm:block w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-black" />
          <Input
            placeholder="Search messages, contacts, campaigns..."
            className="pl-9 bg-secondary/50 border-none focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive border-2 border-background"></span>
        </Button>

        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={avatarSrc} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 text-left sm:block">
            <p className="max-w-40 truncate text-sm font-semibold leading-tight">
              {displayName}
            </p>
            <p className="max-w-40 truncate text-xs text-muted-foreground">
              {user?.email || ""}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
