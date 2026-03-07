import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FormulaBuilder } from "@/components/dashboard/formula-builder";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMRR, formatRelativeDate, getSegmentBadgeClass } from "@/lib/utils";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export const metadata = { title: "Health Scores — HealthScore" };

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function MiniBar({
  value,
  color,
}: {
  value: number | null | undefined;
  color: string;
}) {
  const v = value ?? 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${v}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-6 text-right">
        {v}
      </span>
    </div>
  );
}

function SegmentBadge({ segment }: { segment: string }) {
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

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------

export default async function HealthScoresPage() {
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

  // Fetch accounts with health scores
  const { data: accounts } = await supabase
    .from("hs_accounts")
    .select(
      `
      id, name, mrr, segment, status,
      health_score:hs_health_scores (
        overall_score,
        usage_score,
        support_score,
        billing_score,
        engagement_score,
        nps_score,
        feature_adoption_score,
        churn_risk,
        churn_risk_label,
        calculated_at
      )
    `
    )
    .eq("organization_id", orgId)
    .eq("status", "active")
    .order("mrr", { ascending: false });

  const rows = accounts ?? [];

  // Compute averages
  const scored = rows.filter((a) => {
    const hs = Array.isArray(a.health_score) ? a.health_score[0] : a.health_score;
    return hs != null;
  });

  const avgScore =
    scored.length > 0
      ? Math.round(
          scored.reduce((sum: any, a: any) => {
            const hs = Array.isArray(a.health_score) ? a.health_score[0] : a.health_score;
            return sum + ((hs as { overall_score?: number } | null)?.overall_score ?? 0);
          }, 0) / scored.length
        )
      : null;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Health Scores</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Configure the scoring formula and review each account&apos;s score
          breakdown
        </p>
      </div>

      {/* Formula Builder (Client Component) */}
      <FormulaBuilder />

      <Separator />

      {/* Score Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Account Score Breakdown
            </h2>
            <p className="text-sm text-muted-foreground">
              {rows.length} active account{rows.length !== 1 ? "s" : ""}
              {avgScore !== null && (
                <span>
                  {" "}
                  · Portfolio avg:{" "}
                  <span
                    className={`font-semibold ${
                      avgScore >= 70
                        ? "text-green-600"
                        : avgScore >= 40
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {avgScore}
                  </span>
                </span>
              )}
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-border py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground">No health scores yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Connect an integration to start generating health scores.
              </p>
            </div>
            <Link href="/dashboard/integrations" className="text-sm text-blue-600 hover:underline font-medium">
              Go to Integrations
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="font-semibold text-foreground">Account</TableHead>
                  <TableHead className="font-semibold text-foreground text-center">
                    Score
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">Segment</TableHead>
                  <TableHead className="font-semibold text-foreground">Usage</TableHead>
                  <TableHead className="font-semibold text-foreground">Support</TableHead>
                  <TableHead className="font-semibold text-foreground">Billing</TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Engagement
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">NPS</TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Features
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">MRR</TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Last Updated
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((account) => {
                  const hs = Array.isArray(account.health_score)
                    ? account.health_score[0]
                    : (account.health_score as {
                        overall_score?: number;
                        usage_score?: number;
                        support_score?: number;
                        billing_score?: number;
                        engagement_score?: number;
                        nps_score?: number;
                        feature_adoption_score?: number;
                        churn_risk?: number;
                        calculated_at?: string;
                      } | null);

                  const score = hs?.overall_score;
                  const scoreColor =
                    score == null
                      ? "text-muted-foreground"
                      : score >= 70
                      ? "text-green-700 bg-green-50 border-green-200"
                      : score >= 40
                      ? "text-yellow-700 bg-yellow-50 border-yellow-200"
                      : "text-red-700 bg-red-50 border-red-200";

                  return (
                    <TableRow
                      key={account.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <TableCell>
                        <Link
                          href={`/dashboard/accounts/${account.id}`}
                          className="font-medium text-foreground hover:text-blue-600 transition-colors"
                        >
                          {account.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">
                        {score != null ? (
                          <span
                            className={`inline-flex items-center justify-center w-10 h-7 rounded-md border text-sm font-bold tabular-nums ${scoreColor}`}
                          >
                            {score}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <SegmentBadge segment={account.segment} />
                      </TableCell>
                      <TableCell>
                        <MiniBar
                          value={hs?.usage_score}
                          color={
                            (hs?.usage_score ?? 0) >= 70
                              ? "bg-green-500"
                              : (hs?.usage_score ?? 0) >= 40
                              ? "bg-yellow-400"
                              : "bg-red-500"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <MiniBar
                          value={hs?.support_score}
                          color={
                            (hs?.support_score ?? 0) >= 70
                              ? "bg-green-500"
                              : (hs?.support_score ?? 0) >= 40
                              ? "bg-yellow-400"
                              : "bg-red-500"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <MiniBar
                          value={hs?.billing_score}
                          color={
                            (hs?.billing_score ?? 0) >= 70
                              ? "bg-green-500"
                              : (hs?.billing_score ?? 0) >= 40
                              ? "bg-yellow-400"
                              : "bg-red-500"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <MiniBar
                          value={hs?.engagement_score}
                          color={
                            (hs?.engagement_score ?? 0) >= 70
                              ? "bg-green-500"
                              : (hs?.engagement_score ?? 0) >= 40
                              ? "bg-yellow-400"
                              : "bg-red-500"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <MiniBar
                          value={hs?.nps_score}
                          color={
                            (hs?.nps_score ?? 0) >= 70
                              ? "bg-green-500"
                              : (hs?.nps_score ?? 0) >= 40
                              ? "bg-yellow-400"
                              : "bg-red-500"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <MiniBar
                          value={hs?.feature_adoption_score}
                          color={
                            (hs?.feature_adoption_score ?? 0) >= 70
                              ? "bg-green-500"
                              : (hs?.feature_adoption_score ?? 0) >= 40
                              ? "bg-yellow-400"
                              : "bg-red-500"
                          }
                        />
                      </TableCell>
                      <TableCell className="tabular-nums text-sm font-medium">
                        {formatMRR(account.mrr)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {hs?.calculated_at
                          ? formatRelativeDate(hs.calculated_at)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
