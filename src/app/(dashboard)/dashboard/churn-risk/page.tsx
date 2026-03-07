import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatMRR, formatRelativeDate, getDaysUntil, formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { RunAIAnalysisButton } from "@/components/dashboard/churn-risk/run-ai-analysis-button";
import { ChurnRiskFilters } from "@/components/dashboard/churn-risk/churn-risk-filters";
import { Suspense } from "react";
import {
  AlertTriangle,
  TrendingDown,
  DollarSign,
  ExternalLink,
  Clock,
} from "lucide-react";
import type { ChurnRiskLabel } from "@/lib/types";

export const metadata = { title: "Churn Risk — HealthScore" };

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function RiskBadge({ label }: { label: ChurnRiskLabel | string }) {
  const map: Record<string, string> = {
    critical: "bg-red-100 text-red-800 border-red-300",
    high: "bg-orange-100 text-orange-800 border-orange-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    low: "bg-green-100 text-green-800 border-green-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${
        map[label] ?? "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {label}
    </span>
  );
}

function RiskPct({ pct }: { pct: number }) {
  const color =
    pct >= 70
      ? "text-red-700 bg-red-50 border-red-300"
      : pct >= 40
      ? "text-orange-700 bg-orange-50 border-orange-300"
      : pct >= 20
      ? "text-yellow-700 bg-yellow-50 border-yellow-200"
      : "text-green-700 bg-green-50 border-green-200";
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[3rem] h-7 rounded-md border text-sm font-bold tabular-nums px-2 ${color}`}
    >
      {pct}%
    </span>
  );
}

function ScorePill({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-muted-foreground text-sm">—</span>;
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

// Derive key risk factors from component scores
function getRiskFactors(hs: {
  usage_score?: number;
  support_score?: number;
  billing_score?: number;
  engagement_score?: number;
  nps_score?: number;
  feature_adoption_score?: number;
}): string[] {
  const factors: string[] = [];
  if ((hs.usage_score ?? 100) < 40) factors.push("Low usage");
  if ((hs.support_score ?? 100) < 40) factors.push("Support issues");
  if ((hs.billing_score ?? 100) < 40) factors.push("Payment failures");
  if ((hs.engagement_score ?? 100) < 40) factors.push("Low engagement");
  if ((hs.nps_score ?? 100) < 40) factors.push("Poor NPS");
  if ((hs.feature_adoption_score ?? 100) < 40) factors.push("Feature stagnation");
  return factors.slice(0, 3); // max 3
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------

interface PageProps {
  searchParams: Promise<{ risk?: string }>;
}

export default async function ChurnRiskPage({ searchParams }: PageProps) {
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

  // Fetch accounts with health scores, sorted by churn_risk DESC
  let query = supabase
    .from("hs_accounts")
    .select(
      `
      id, name, mrr, renewal_date, segment, status,
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
        churn_predicted_at
      )
    `
    )
    .eq("organization_id", orgId)
    .eq("status", "active");

  if (
    params.risk &&
    ["critical", "high", "medium", "low"].includes(params.risk)
  ) {
    // Filter via health score label — we post-filter since join filter is complex
  }

  const { data: accounts } = await query;

  // Post-process: flatten health_score, filter by risk label, sort by churn_risk DESC
  type AccountRow = {
    id: string;
    name: string;
    mrr: number;
    renewal_date: string | null;
    segment: string;
    status: string;
    hs: {
      overall_score: number;
      usage_score: number;
      support_score: number;
      billing_score: number;
      engagement_score: number;
      nps_score: number;
      feature_adoption_score: number;
      churn_risk: number;
      churn_risk_label: string;
      churn_predicted_at?: string | null;
    } | null;
  };

  let rows: AccountRow[] = (accounts ?? []).map((a: any) => {
    const hs = Array.isArray(a.health_score)
      ? a.health_score[0]
      : (a.health_score as AccountRow["hs"]);
    return { ...a, hs: hs ?? null };
  });

  // Filter by risk label if param present
  if (params.risk && ["critical", "high", "medium", "low"].includes(params.risk)) {
    rows = rows.filter((r) => r.hs?.churn_risk_label === params.risk);
  }

  // Sort by churn_risk desc
  rows.sort((a: any, b: any) => (b.hs?.churn_risk ?? 0) - (a.hs?.churn_risk ?? 0));

  // Stats
  const allWithHs = rows.filter((r) => r.hs != null);
  const criticalCount = allWithHs.filter(
    (r) => r.hs?.churn_risk_label === "critical"
  ).length;
  const highCount = allWithHs.filter(
    (r) => r.hs?.churn_risk_label === "high"
  ).length;
  const atRiskMRR = allWithHs
    .filter(
      (r) =>
        r.hs?.churn_risk_label === "critical" || r.hs?.churn_risk_label === "high"
    )
    .reduce((sum, r) => sum + (r.mrr || 0), 0);

  // Last prediction time
  const lastPredicted = allWithHs.reduce<string | null>((latest, r) => {
    const t = r.hs?.churn_predicted_at;
    if (!t) return latest;
    if (!latest) return t;
    return t > latest ? t : latest;
  }, null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Churn Risk</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Predictive churn analysis for your customer accounts
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {lastPredicted && (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 bg-slate-100 border border-border px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              Last run: {formatRelativeDate(lastPredicted)}
            </span>
          )}
          <RunAIAnalysisButton />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
          label="Critical Risk"
          value={criticalCount.toString()}
          sub="accounts"
          bg="bg-red-50 border-red-200"
          valueColor="text-red-700"
        />
        <StatCard
          icon={<TrendingDown className="w-4 h-4 text-orange-500" />}
          label="High Risk"
          value={highCount.toString()}
          sub="accounts"
          bg="bg-orange-50 border-orange-200"
          valueColor="text-orange-700"
        />
        <StatCard
          icon={<DollarSign className="w-4 h-4 text-yellow-600" />}
          label="MRR at Risk"
          value={formatMRR(atRiskMRR)}
          sub="critical + high"
          bg="bg-yellow-50 border-yellow-200"
          valueColor="text-yellow-700"
        />
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <ChurnRiskFilters currentRisk={params.risk ?? ""} />
      </Suspense>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-border py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-green-500" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground">
              {params.risk ? "No accounts match this filter" : "No churn risks detected"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {params.risk
                ? "Try selecting a different risk level"
                : "All accounts appear healthy. Run Analysis to get the latest predictions."}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="font-semibold text-foreground">Account</TableHead>
                <TableHead className="font-semibold text-foreground text-center">
                  Health Score
                </TableHead>
                <TableHead className="font-semibold text-foreground text-center">
                  Churn Risk
                </TableHead>
                <TableHead className="font-semibold text-foreground">Risk Level</TableHead>
                <TableHead className="font-semibold text-foreground">
                  Key Factors
                </TableHead>
                <TableHead className="font-semibold text-foreground">MRR</TableHead>
                <TableHead className="font-semibold text-foreground">
                  Days to Renewal
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((account) => {
                const hs = account.hs;
                const churnPct = hs ? Math.round(hs.churn_risk * 100) : null;
                const factors = hs ? getRiskFactors(hs) : [];
                const daysLeft = account.renewal_date
                  ? getDaysUntil(account.renewal_date)
                  : null;

                const renewalColor =
                  daysLeft === null
                    ? "text-muted-foreground"
                    : daysLeft < 0
                    ? "text-red-600"
                    : daysLeft <= 30
                    ? "text-orange-600"
                    : "text-foreground";

                // Row highlight for critical
                const rowClass =
                  hs?.churn_risk_label === "critical"
                    ? "bg-red-50/30 hover:bg-red-50/50"
                    : hs?.churn_risk_label === "high"
                    ? "bg-orange-50/20 hover:bg-orange-50/40"
                    : "hover:bg-slate-50/60";

                return (
                  <TableRow
                    key={account.id}
                    className={`transition-colors ${rowClass}`}
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
                      <ScorePill score={hs?.overall_score} />
                    </TableCell>
                    <TableCell className="text-center">
                      {churnPct !== null ? (
                        <RiskPct pct={churnPct} />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {hs?.churn_risk_label ? (
                        <RiskBadge label={hs.churn_risk_label} />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {factors.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {factors.map((f, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          No major factors
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium tabular-nums">
                      {formatMRR(account.mrr)}
                    </TableCell>
                    <TableCell>
                      {daysLeft !== null ? (
                        <div>
                          <div className={`text-sm font-medium ${renewalColor}`}>
                            {daysLeft < 0
                              ? `${Math.abs(daysLeft)}d overdue`
                              : daysLeft === 0
                              ? "Today"
                              : `${daysLeft}d`}
                          </div>
                          {account.renewal_date && (
                            <div className="text-xs text-muted-foreground">
                              {formatDate(account.renewal_date)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/accounts/${account.id}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
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
// Stat Card
// ------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  sub,
  bg,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  bg: string;
  valueColor: string;
}) {
  return (
    <div className={`rounded-xl border p-5 ${bg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {icon}
      </div>
      <div className={`text-2xl font-bold tabular-nums ${valueColor}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}
