"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Bell, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/dashboard/global-search";

interface HeaderProps {
  profile: {
    full_name?: string;
    email: string;
    role: string;
    organization?: { name: string; plan: string };
  } | null;
}

export function DashboardHeader({ profile }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
      {/* Search */}
      <GlobalSearch />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Alerts bell */}
        <Link href="/dashboard/alerts">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Button>
        </Link>

        {/* Settings */}
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        </Link>

        {/* User avatar + logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-foreground leading-tight">
              {profile?.full_name || "User"}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {profile?.role}
            </div>
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {profile?.full_name?.[0]?.toUpperCase() ||
              profile?.email?.[0]?.toUpperCase() ||
              "U"}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
