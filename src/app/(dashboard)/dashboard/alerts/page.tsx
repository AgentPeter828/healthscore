import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Alert, AlertSeverity } from "@/lib/types";
import Link from "next/link";
import { Bell, BellOff, AlertTriangle, CheckCheck, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Alerts" };

function getSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case "critical":
      return "bg-red-500";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-blue-500";
    default:
      return "bg-slate-400";
  }
}

function getSeverityBadgeClass(severity: AlertSeverity): string {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-700 border-red-200";
    case "high":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "medium":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "low":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) redirect("/dashboard/onboarding");
  const orgId = profile.organization_id;

  const { data: alerts } = await supabase
    .from("hs_alerts")
    .select("*, account:hs_accounts(id, name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  const typedAlerts = (alerts ?? []) as (Alert & {
    account?: { id: string; name: string } | null;
  })[];

  // Counts by severity (unread only)
  const unreadAlerts = typedAlerts.filter((a) => !a.is_read);
  const criticalCount = unreadAlerts.filter((a) => a.severity === "critical").length;
  const highCount = unreadAlerts.filter((a) => a.severity === "high").length;
  const mediumCount = unreadAlerts.filter((a) => a.severity === "medium").length;
  const lowCount = unreadAlerts.filter((a) => a.severity === "low").length;

  // Apply filter
  let filteredAlerts = typedAlerts;
  if (filter === "unread") filteredAlerts = typedAlerts.filter((a) => !a.is_read);
  else if (filter === "critical") filteredAlerts = typedAlerts.filter((a) => a.severity === "critical");
  else if (filter === "high") filteredAlerts = typedAlerts.filter((a) => a.severity === "high");
  else if (filter === "medium") filteredAlerts = typedAlerts.filter((a) => a.severity === "medium");
  else if (filter === "low") filteredAlerts = typedAlerts.filter((a) => a.severity === "low");

  // Group: unread first, then read
  const unread = filteredAlerts.filter((a) => !a.is_read);
  const read = filteredAlerts.filter((a) => a.is_read);

  const FILTERS = [
    { key: "all", label: "All" },
    { key: "unread", label: `Unread (${unreadAlerts.length})` },
    { key: "critical", label: "Critical" },
    { key: "high", label: "High" },
    { key: "medium", label: "Medium" },
    { key: "low", label: "Low" },
  ];

  const activeFilter = filter ?? "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alerts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Health signals and automated notifications
          </p>
        </div>
        {unreadAlerts.length > 0 && (
          <form action="/api/alerts/mark-all-read" method="POST">
            <Button type="submit" variant="outline" size="sm" className="gap-1.5">
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </Button>
          </form>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Critical", count: criticalCount, color: "text-red-600", bg: "bg-red-50 border-red-200" },
          { label: "High", count: highCount, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
          { label: "Medium", count: mediumCount, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
          { label: "Low", count: lowCount, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`rounded-xl border p-4 ${bg}`}>
            <div className={`text-2xl font-bold ${color}`}>{count}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{label} unread</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {FILTERS.map(({ key, label }) => (
          <Link
            key={key}
            href={`/dashboard/alerts${key !== "all" ? `?filter=${key}` : ""}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === key
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-100"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Alert list */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-16 text-center">
          <BellOff className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No alerts</h3>
          <p className="text-sm text-muted-foreground">
            {activeFilter === "unread"
              ? "You're all caught up! No unread alerts."
              : "No alerts match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Unread group */}
          {unread.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Unread ({unread.length})
                </h2>
              </div>
              <div className="bg-white rounded-xl border border-border divide-y divide-border overflow-hidden">
                {unread.map((alert) => (
                  <AlertRow key={alert.id} alert={alert} />
                ))}
              </div>
            </div>
          )}

          {/* Read group */}
          {read.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCheck className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Read ({read.length})
                </h2>
              </div>
              <div className="bg-white rounded-xl border border-border divide-y divide-border overflow-hidden opacity-75">
                {read.map((alert) => (
                  <AlertRow key={alert.id} alert={alert} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AlertRow({
  alert,
}: {
  alert: Alert & { account?: { id: string; name: string } | null };
}) {
  const account = Array.isArray(alert.account) ? alert.account[0] : alert.account;

  return (
    <div
      className={`flex items-start gap-3 px-5 py-4 ${
        !alert.is_read ? "bg-blue-50/30" : ""
      }`}
    >
      {/* Severity dot */}
      <div className="mt-1.5 flex-shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full ${getSeverityColor(alert.severity)}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-foreground">{alert.title}</span>
              <Badge
                variant="outline"
                className={`text-xs capitalize ${getSeverityBadgeClass(alert.severity)}`}
              >
                {alert.severity}
              </Badge>
              {!alert.is_read && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>
            <div className="flex items-center gap-3 mt-1.5">
              {account && (
                <Link
                  href={`/dashboard/accounts/${account.id}`}
                  className="text-xs text-blue-600 hover:text-blue-500 font-medium"
                >
                  {account.name}
                </Link>
              )}
              <span className="text-xs text-muted-foreground">{timeAgo(alert.created_at)}</span>
            </div>
          </div>

          {/* Mark read */}
          {!alert.is_read && (
            <form action={`/api/alerts/${alert.id}/mark-read`} method="POST" className="flex-shrink-0">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <Circle className="w-3 h-3" />
                Mark Read
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
