"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Activity,
  LayoutDashboard,
  Users,
  TrendingUp,
  Zap,
  Settings,
  Bell,
  Calendar,
  GitBranch,
  Puzzle,
  ChevronDown,
  Crown,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Accounts",
    href: "/dashboard/accounts",
    icon: Users,
  },
  {
    label: "Health Scores",
    href: "/dashboard/health-scores",
    icon: Activity,
  },
  {
    label: "Churn Risk",
    href: "/dashboard/churn-risk",
    icon: TrendingUp,
  },
  {
    label: "Playbooks",
    href: "/dashboard/playbooks",
    icon: GitBranch,
  },
  {
    label: "Renewals",
    href: "/dashboard/renewals",
    icon: Calendar,
  },
  {
    label: "Alerts",
    href: "/dashboard/alerts",
    icon: Bell,
  },
  {
    label: "Integrations",
    href: "/dashboard/integrations",
    icon: Puzzle,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    dividerBefore: true,
  },
];

interface SidebarProps {
  profile: {
    full_name?: string;
    email: string;
    role: string;
    organization?: {
      name: string;
      plan: string;
    };
  } | null;
}

export function DashboardSidebar({ profile }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const planName = profile?.organization?.plan || "free";

  return (
    <aside className="w-60 flex-shrink-0 bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">
          HealthScore
        </span>
      </div>

      {/* Org selector */}
      <div className="px-3 py-2 border-b border-sidebar-border">
        <button className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors">
          <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {profile?.organization?.name?.[0]?.toUpperCase() || "O"}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {profile?.organization?.name || "My Organization"}
            </div>
            <div className="text-xs text-slate-400 capitalize flex items-center gap-1">
              {planName === "scale" && <Crown className="w-3 h-3 text-yellow-400" />}
              {planName} plan
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <div key={item.href}>
            {item.dividerBefore && (
              <div className="border-t border-sidebar-border my-2" />
            )}
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors",
                isActive(item.href, item.exact)
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-sidebar-accent hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          </div>
        ))}
      </nav>

      {/* Upgrade prompt (for free plan) */}
      {planName === "free" && (
        <div className="px-3 pb-3">
          <div className="bg-blue-950 border border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-300 font-medium mb-1">
              Upgrade to Starter
            </p>
            <p className="text-xs text-blue-400 mb-2">
              Get AI predictions, Slack alerts, and 500 accounts.
            </p>
            <Link
              href="/dashboard/billing"
              className="block text-center text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-md py-1.5 font-medium transition-colors"
            >
              Upgrade — $49/mo
            </Link>
          </div>
        </div>
      )}

      {/* User profile */}
      <div className="px-3 pb-3 border-t border-sidebar-border pt-3">
        <Link
          href="/dashboard/settings/profile"
          className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors"
        >
          <div className="w-7 h-7 bg-slate-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {profile?.full_name?.[0]?.toUpperCase() ||
              profile?.email?.[0]?.toUpperCase() ||
              "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate font-medium">
              {profile?.full_name || "User"}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {profile?.email}
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
