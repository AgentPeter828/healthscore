import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  formatMRR,
  formatDate,
  getDaysUntil,
  getScoreColor,
  getSegmentBadgeClass,
} from "@/lib/utils";
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
import { AccountsFilters } from "@/components/dashboard/accounts/accounts-filters";
import { Suspense } from "react";
import { Plus, Users, ExternalLink } from "lucide-react";
import type { AccountStatus, SegmentColor } from "@/lib/types";

export const metadata = { title: "Accounts — HealthScore" };

interface PageProps {
  searchParams: Promise<{
    segment?: string;
    status?: string;
    search?: string;
  }>;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function ScorePill({ score }: { score: number | null }) {
  if (score === null || score === undefined) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  const color =
    score >= 70
      ? "text-green-700 bg-green-50 border-green-200"
      : score >= 40
      ? "text-yellow-700 bg-yellow-50 border-yellow-200"
      : "text-red-700 bg-red-50 border-red-200";
  return (
    <span
      className={`inline-flex items-center justify-center w-10 h-7 rounded-md border text-sm font-bold tabular-nums ${color}`}
    >
      {score}
    </span>
  );
}

function SegmentBadge({ segment }: { segment: SegmentColor | string }) {
  const cls = getSegmentBadgeClass(segment);
  const label =
    segment === "green" ? "Healthy" : segment === "yellow" ? "At Risk" : "Critical";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: AccountStatus | string }) {
  const map: Record<string, string> = {
    active: "bg-green-50 text-green-700 border-green-200",
    trial: "bg-blue-50 text-blue-700 border-blue-200",
    paused: "bg-slate-100 text-slate-600 border-slate-200",
    churned: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
        map[status] ?? "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      {status}
    </span>
  );
}

function ChurnRiskCell({ risk }: { risk: number | null }) {
  if (risk === null || risk === undefined)
    return <span className="text-muted-foreground text-sm">—</span>;
  const pct = Math.round(risk * 100);
  const color =
    pct >= 70
      ? "text-red-600"
      : pct >= 40
      ? "text-orange-500"
      : pct >= 20
      ? "text-yellow-600"
      : "text-green-600";
  return <span className={`text-sm font-medium tabular-nums ${color}`}>{pct}%</span>;
}

// ------------------------------------------------------------------
// Add Account Dialog (Client wrapper)
// ------------------------------------------------------------------

import { AddAccountButton } from "@/components/dashboard/accounts/add-account-button";

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------

export default async function AccountsPage({ searchParams }: PageProps) {
  const params = await searchParams;
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

  // Build query
  let query = supabase
    .from("hs_accounts")
    .select(
      `
      id, name, domain, plan, mrr, arr, seats, renewal_date, status, segment,
      csm_id,
      health_score:hs_health_scores (
        overall_score, churn_risk, churn_risk_label
      ),
      csm:profiles!hs_accounts_csm_id_fkey (
        full_name, email
      )
    `
    )
    .eq("organization_id", orgId)
    .order("mrr", { ascending: false });

  if (params.segment && ["green", "yellow", "red"].includes(params.segment)) {
    query = query.eq("segment", params.segment);
  }
  if (params.status) {
    query = query.eq("status", params.status as AccountStatus);
  }
  if (params.search) {
    query = query.ilike("name", `%${params.search}%`);
  }

  const { data: accounts } = await query;

  const rows = accounts ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {rows.length} account{rows.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your customer accounts and track their health
          </p>
        </div>
        <AddAccountButton />
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-9 bg-slate-100 rounded-md animate-pulse w-full" />}>
        <AccountsFilters />
      </Suspense>

      {/* Table */}
      {rows.length === 0 ? (
        <EmptyState search={params.search} segment={params.segment} />
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="font-semibold text-foreground">Account</TableHead>
                <TableHead className="font-semibold text-foreground text-center">
                  Health Score
                </TableHead>
                <TableHead className="font-semibold text-foreground">Segment</TableHead>
                <TableHead className="font-semibold text-foreground">MRR</TableHead>
                <TableHead className="font-semibold text-foreground">Seats</TableHead>
                <TableHead className="font-semibold text-foreground">Renewal</TableHead>
                <TableHead className="font-semibold text-foreground">Churn Risk</TableHead>
                <TableHead className="font-semibold text-foreground">CSM</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((account: any) => {
                const hs = Array.isArray(account.health_score)
                  ? account.health_score[0]
                  : (account.health_score as {
                      overall_score?: number;
                      churn_risk?: number;
                      churn_risk_label?: string;
                    } | null);
                const csm = Array.isArray(account.csm)
                  ? account.csm[0]
                  : (account.csm as { full_name?: string; email?: string } | null);

                const daysUntilRenewal = account.renewal_date
                  ? getDaysUntil(account.renewal_date)
                  : null;

                const renewalUrgency =
                  daysUntilRenewal !== null
                    ? daysUntilRenewal < 0
                      ? "text-red-500"
                      : daysUntilRenewal <= 30
                      ? "text-orange-500"
                      : "text-muted-foreground"
                    : "";

                return (
                  <TableRow
                    key={account.id}
                    className="hover:bg-slate-50/60 cursor-pointer transition-colors group"
                  >
                    <TableCell>
                      <Link
                        href={`/dashboard/accounts/${account.id}`}
                        className="block"
                      >
                        <div className="font-medium text-foreground group-hover:text-blue-600 transition-colors">
                          {account.name}
                        </div>
                        {account.domain && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {account.domain}
                          </div>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Link href={`/dashboard/accounts/${account.id}`}>
                        <ScorePill score={hs?.overall_score ?? null} />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/accounts/${account.id}`}>
                        <SegmentBadge segment={account.segment} />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/accounts/${account.id}`}
                        className="text-sm font-medium tabular-nums"
                      >
                        {formatMRR(account.mrr)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/accounts/${account.id}`}
                        className="text-sm tabular-nums text-muted-foreground"
                      >
                        {account.seats}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/accounts/${account.id}`}>
                        {account.renewal_date ? (
                          <div>
                            <div className={`text-sm font-medium ${renewalUrgency}`}>
                              {formatDate(account.renewal_date)}
                            </div>
                            {daysUntilRenewal !== null && (
                              <div className="text-xs text-muted-foreground">
                                {daysUntilRenewal < 0
                                  ? `${Math.abs(daysUntilRenewal)}d overdue`
                                  : `${daysUntilRenewal}d`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/accounts/${account.id}`}>
                        <ChurnRiskCell risk={hs?.churn_risk ?? null} />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/accounts/${account.id}`}>
                        {csm?.full_name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {csm.full_name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <span className="text-sm text-foreground truncate max-w-[100px]">
                              {csm.full_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/accounts/${account.id}`}>
                        <StatusBadge status={account.status} />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/accounts/${account.id}`}
                        className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="View account"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Empty state
// ------------------------------------------------------------------

function EmptyState({
  search,
  segment,
}: {
  search?: string;
  segment?: string;
}) {
  const isFiltered = search || segment;
  return (
    <div className="bg-white rounded-xl border border-border py-20 flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
        <Users className="w-6 h-6 text-slate-400" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground">
          {isFiltered ? "No accounts match your filters" : "No accounts yet"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {isFiltered
            ? "Try adjusting your search or segment filters"
            : "No accounts yet. Connect an integration to start tracking customer health."}
        </p>
      </div>
      {!isFiltered && (
        <div className="flex items-center gap-3">
          <Link href="/dashboard/integrations">
            <Button variant="outline" size="sm">
              Connect Integration
            </Button>
          </Link>
          <AddAccountButton />
        </div>
      )}
    </div>
  );
}
