import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatMRR, getScoreColor, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  Users,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Calendar,
  DollarSign,
  Activity,
  ArrowRight,
  Bell,
} from "lucide-react";
import { PortfolioPieChart } from "@/components/dashboard/portfolio-pie-chart";
import { HealthTrendChart } from "@/components/dashboard/health-trend-chart";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, organization:hs_organizations(id, name, plan)")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) redirect("/dashboard/onboarding");

  const orgId = profile.organization_id;

  // Fetch aggregated data in parallel
  const [
    { data: accounts },
    { data: alertsData },
    { data: renewalsData },
    { data: recentScores },
  ] = await Promise.all([
    supabase
      .from("hs_accounts")
      .select(
        "id, name, mrr, segment, status, renewal_date, health_score:hs_health_scores(overall_score, churn_risk_label)"
      )
      .eq("organization_id", orgId)
      .eq("status", "active")
      .order("mrr", { ascending: false }),
    supabase
      .from("hs_alerts")
      .select("id, type, severity, title, created_at")
      .eq("organization_id", orgId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("hs_renewals")
      .select("id, renewal_date, contract_value, status, account:hs_accounts(name, segment)")
      .eq("organization_id", orgId)
      .eq("status", "upcoming")
      .gte("renewal_date", new Date().toISOString().split("T")[0])
      .lte(
        "renewal_date",
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      )
      .order("renewal_date", { ascending: true })
      .limit(5),
    supabase
      .from("hs_health_score_history")
      .select("snapshot_date, overall_score")
      .eq("organization_id", orgId)
      .gte(
        "snapshot_date",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      )
      .order("snapshot_date", { ascending: true }),
  ]);

  // Compute stats
  const activeAccounts = accounts || [];
  const greenAccounts = activeAccounts.filter((a) => a.segment === "green");
  const yellowAccounts = activeAccounts.filter((a) => a.segment === "yellow");
  const redAccounts = activeAccounts.filter((a) => a.segment === "red");

  const totalMRR = activeAccounts.reduce((sum, a) => sum + (a.mrr || 0), 0);
  const atRiskMRR = [...yellowAccounts, ...redAccounts].reduce(
    (sum, a) => sum + (a.mrr || 0),
    0
  );

  const avgScore =
    activeAccounts.length > 0
      ? Math.round(
          activeAccounts.reduce((sum, a) => {
            const score = Array.isArray(a.health_score)
              ? a.health_score[0]?.overall_score
              : (a.health_score as { overall_score?: number } | null)?.overall_score;
            return sum + (score || 0);
          }, 0) / activeAccounts.length
        )
      : 0;

  // Chart data: aggregate score history by date
  const scoreByDate: Record<string, number[]> = {};
  for (const row of recentScores || []) {
    if (!scoreByDate[row.snapshot_date]) scoreByDate[row.snapshot_date] = [];
    scoreByDate[row.snapshot_date].push(row.overall_score);
  }
  const trendData = Object.entries(scoreByDate)
    .map(([date, scores]) => ({
      date,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }))
    .slice(-14);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Portfolio Health</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Overview of your entire customer base
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Accounts"
          value={activeAccounts.length.toString()}
          icon={<Users className="w-4 h-4" />}
          subtitle={`${redAccounts.length} critical`}
          subtitleColor="text-red-500"
        />
        <StatCard
          title="Avg Health Score"
          value={avgScore.toString()}
          icon={<Activity className="w-4 h-4" />}
          subtitle="Portfolio average"
          valueColor={getScoreColor(avgScore)}
        />
        <StatCard
          title="Total MRR"
          value={formatMRR(totalMRR)}
          icon={<DollarSign className="w-4 h-4" />}
          subtitle={`${formatMRR(atRiskMRR)} at risk`}
          subtitleColor="text-yellow-600"
        />
        <StatCard
          title="Open Alerts"
          value={(alertsData?.length || 0).toString()}
          icon={<Bell className="w-4 h-4" />}
          subtitle="Unread"
          href="/dashboard/alerts"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Segment breakdown */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">
            Segment Breakdown
          </h2>
          <PortfolioPieChart
            green={greenAccounts.length}
            yellow={yellowAccounts.length}
            red={redAccounts.length}
          />
          <div className="mt-4 space-y-2">
            <SegmentRow
              color="green"
              label="Healthy (≥70)"
              count={greenAccounts.length}
              total={activeAccounts.length}
            />
            <SegmentRow
              color="yellow"
              label="At Risk (40-69)"
              count={yellowAccounts.length}
              total={activeAccounts.length}
            />
            <SegmentRow
              color="red"
              label="Critical (<40)"
              count={redAccounts.length}
              total={activeAccounts.length}
            />
          </div>
        </div>

        {/* Health score trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">
            Portfolio Score Trend (30d)
          </h2>
          <HealthTrendChart data={trendData} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* At-risk accounts */}
        <div className="bg-white rounded-xl border border-border">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="font-semibold text-foreground">
              Critical Accounts
            </h2>
            <Link
              href="/dashboard/accounts?segment=red"
              className="text-sm text-blue-600 hover:text-blue-500 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {redAccounts.slice(0, 5).length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-400" />
                No critical accounts — great work!
              </div>
            ) : (
              redAccounts.slice(0, 5).map((account) => {
                const score = Array.isArray(account.health_score)
                  ? account.health_score[0]?.overall_score
                  : (account.health_score as { overall_score?: number } | null)?.overall_score;
                return (
                  <Link
                    key={account.id}
                    href={`/dashboard/accounts/${account.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm text-foreground">
                        {account.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatMRR(account.mrr)} MRR
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-500">
                        {score ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">score</div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming renewals */}
        <div className="bg-white rounded-xl border border-border">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="font-semibold text-foreground">
              Renewals Next 30 Days
            </h2>
            <Link
              href="/dashboard/renewals"
              className="text-sm text-blue-600 hover:text-blue-500 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {renewalsData?.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No renewals due in the next 30 days
              </div>
            ) : (
              renewalsData?.slice(0, 5).map((renewal) => {
                const account = Array.isArray(renewal.account)
                  ? renewal.account[0]
                  : renewal.account as { name?: string; segment?: string } | null;
                return (
                  <Link
                    key={renewal.id}
                    href="/dashboard/renewals"
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm text-foreground">
                        {account?.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(renewal.renewal_date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground">
                        {renewal.contract_value
                          ? formatMRR(renewal.contract_value)
                          : "—"}
                      </div>
                      <div
                        className={`text-xs font-medium ${
                          account?.segment === "red"
                            ? "text-red-500"
                            : account?.segment === "yellow"
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      >
                        {account?.segment === "red"
                          ? "⚠ At risk"
                          : account?.segment === "yellow"
                          ? "Monitor"
                          : "Healthy"}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      {alertsData && alertsData.length > 0 && (
        <div className="bg-white rounded-xl border border-border">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Recent Alerts
            </h2>
            <Link
              href="/dashboard/alerts"
              className="text-sm text-blue-600 hover:text-blue-500 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {alertsData.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-3 px-5 py-3"
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    alert.severity === "critical"
                      ? "bg-red-500"
                      : alert.severity === "high"
                      ? "bg-orange-500"
                      : alert.severity === "medium"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {alert.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(alert.created_at)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground capitalize bg-slate-100 px-2 py-0.5 rounded">
                  {alert.severity}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  subtitle,
  subtitleColor,
  valueColor,
  href,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle: string;
  subtitleColor?: string;
  valueColor?: string;
  href?: string;
}) {
  const content = (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">
          {title}
        </span>
        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
      </div>
      <div className={`text-2xl font-bold ${valueColor || "text-foreground"}`}>
        {value}
      </div>
      <div className={`text-xs mt-1 ${subtitleColor || "text-muted-foreground"}`}>
        {subtitle}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function SegmentRow({
  color,
  label,
  count,
  total,
}: {
  color: string;
  label: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const bg =
    color === "green"
      ? "bg-green-500"
      : color === "yellow"
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2.5 h-2.5 rounded-full ${bg} flex-shrink-0`} />
      <span className="flex-1 text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{count}</span>
      <span className="text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}
