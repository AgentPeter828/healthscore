import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDate, formatMRR, getSegmentBadgeClass } from "@/lib/utils";
import { Renewal, RenewalStatus, SegmentColor } from "@/lib/types";
import Link from "next/link";
import { RenewalsCalendar } from "@/components/dashboard/renewals/renewals-calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  List,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export const metadata = { title: "Renewals" };

type ViewMode = "list" | "calendar";

function getRenewalUrgencyClass(dateStr: string): string {
  const days = Math.floor(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (days < 0) return "text-red-600 font-semibold";
  if (days <= 7) return "text-orange-600 font-semibold";
  if (days <= 30) return "text-yellow-600 font-medium";
  return "text-foreground";
}

function getRenewalUrgencyLabel(dateStr: string): string {
  const days = Math.floor(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `${days}d`;
  if (days <= 30) return `${days}d`;
  return formatDate(dateStr);
}

function getRenewalStatusBadge(status: RenewalStatus): React.ReactNode {
  const map: Record<RenewalStatus, { label: string; class: string }> = {
    upcoming: { label: "Upcoming", class: "bg-blue-100 text-blue-700 border-blue-200" },
    at_risk: { label: "At Risk", class: "bg-red-100 text-red-700 border-red-200" },
    renewed: { label: "Renewed", class: "bg-green-100 text-green-700 border-green-200" },
    churned: { label: "Churned", class: "bg-slate-100 text-slate-600 border-slate-200" },
    expanded: { label: "Expanded", class: "bg-purple-100 text-purple-700 border-purple-200" },
  };
  const config = map[status] ?? map.upcoming;
  return (
    <Badge variant="outline" className={`text-xs ${config.class}`}>
      {config.label}
    </Badge>
  );
}

export default async function RenewalsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const viewMode: ViewMode = view === "calendar" ? "calendar" : "list";

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

  const { data: renewals } = await supabase
    .from("hs_renewals")
    .select(
      "*, account:hs_accounts(id, name, segment, health_score:hs_health_scores(overall_score)), owner:profiles(full_name)"
    )
    .eq("organization_id", orgId)
    .order("renewal_date", { ascending: true });

  type RenewalRow = Renewal & {
    account?: {
      id: string;
      name: string;
      segment: SegmentColor;
      health_score?: { overall_score: number }[] | { overall_score: number } | null;
    } | null;
    owner?: { full_name?: string } | null;
  };

  const typedRenewals = (renewals ?? []) as RenewalRow[];

  // Stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const thisMonthRenewals = typedRenewals.filter((r) => {
    const d = new Date(r.renewal_date);
    return d >= startOfMonth && d <= endOfMonth;
  });

  const thisMonthValue = thisMonthRenewals.reduce(
    (sum, r) => sum + (r.contract_value ?? 0),
    0
  );

  const atRiskRenewals = typedRenewals.filter((r) => r.status === "at_risk");

  const wonRenewals = typedRenewals.filter((r) => r.status === "renewed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Renewals</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track and manage upcoming contract renewals
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <Link
            href="/dashboard/renewals?view=list"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="w-4 h-4" />
            List
          </Link>
          <Link
            href="/dashboard/renewals?view=calendar"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "calendar"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">This Month</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{thisMonthRenewals.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {thisMonthValue > 0 ? formatMRR(thisMonthValue) : "—"} contract value
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-muted-foreground font-medium">At Risk</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{atRiskRenewals.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">require immediate attention</div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm text-muted-foreground font-medium">Won</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{wonRenewals.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">renewals closed</div>
        </div>
      </div>

      {/* Content */}
      {viewMode === "calendar" ? (
        <RenewalsCalendar renewals={typedRenewals as Parameters<typeof RenewalsCalendar>[0]["renewals"]} />
      ) : (
        /* List view */
        typedRenewals.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-16 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No renewals yet</h3>
            <p className="text-sm text-muted-foreground">
              Renewals are created from account data. Set a renewal date on any account to track it here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Renewal Date</TableHead>
                  <TableHead>Contract Value</TableHead>
                  <TableHead>Health Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedRenewals.map((renewal) => {
                  const account = Array.isArray(renewal.account)
                    ? renewal.account[0]
                    : renewal.account;
                  const owner = Array.isArray(renewal.owner)
                    ? renewal.owner[0]
                    : renewal.owner;
                  const healthScore = account?.health_score
                    ? Array.isArray(account.health_score)
                      ? account.health_score[0]?.overall_score
                      : (account.health_score as { overall_score: number } | null)?.overall_score
                    : null;

                  return (
                    <TableRow key={renewal.id}>
                      {/* Account */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/accounts/${account?.id}`}
                            className="font-medium text-foreground hover:text-blue-600 transition-colors"
                          >
                            {account?.name ?? "—"}
                          </Link>
                          {account?.segment && (
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize ${getSegmentBadgeClass(account.segment)}`}
                            >
                              {account.segment}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Renewal date */}
                      <TableCell>
                        <span className={getRenewalUrgencyClass(renewal.renewal_date)}>
                          {getRenewalUrgencyLabel(renewal.renewal_date)}
                        </span>
                        {(() => {
                          const days = Math.floor(
                            (new Date(renewal.renewal_date).getTime() - Date.now()) /
                              (1000 * 60 * 60 * 24)
                          );
                          if (days > 1 && days <= 30) {
                            return (
                              <div className="text-xs text-muted-foreground">
                                {formatDate(renewal.renewal_date)}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </TableCell>

                      {/* Contract value */}
                      <TableCell>
                        {renewal.contract_value ? (
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                            {renewal.contract_value.toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Health score */}
                      <TableCell>
                        {healthScore !== null && healthScore !== undefined ? (
                          <span
                            className={`font-bold text-sm ${
                              healthScore >= 70
                                ? "text-green-600"
                                : healthScore >= 40
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {healthScore}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>{getRenewalStatusBadge(renewal.status)}</TableCell>

                      {/* Owner */}
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {owner?.full_name ?? "—"}
                        </span>
                      </TableCell>

                      {/* Notes */}
                      <TableCell className="max-w-[200px]">
                        <span className="text-sm text-muted-foreground truncate block">
                          {renewal.notes ?? "—"}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {account?.id && (
                            <Link href={`/dashboard/accounts/${account.id}`}>
                              <Button variant="ghost" size="sm" className="px-2">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )
      )}
    </div>
  );
}
