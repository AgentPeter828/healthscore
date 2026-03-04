import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  formatMRR,
  formatDate,
  formatRelativeDate,
  getDaysUntil,
  getSegmentBadgeClass,
  getScoreColor,
  getScoreLabel,
  getChurnRiskColor,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HealthTrendChart } from "@/components/dashboard/health-trend-chart";
import { AccountDetailActions } from "@/components/dashboard/accounts/account-detail-actions";
import {
  Globe,
  Building2,
  Calendar,
  DollarSign,
  Users,
  Activity,
  ArrowLeft,
  Clock,
  Mail,
  Phone,
  User,
  Tag,
  Zap,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("hs_accounts")
    .select("name")
    .eq("id", id)
    .single();
  return { title: data ? `${data.name} — HealthScore` : "Account" };
}

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------

function SegmentBadge({ segment }: { segment: string }) {
  const cls = getSegmentBadgeClass(segment);
  const label =
    segment === "green" ? "Healthy" : segment === "yellow" ? "At Risk" : "Critical";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-50 text-green-700 border-green-200",
    trial: "bg-blue-50 text-blue-700 border-blue-200",
    paused: "bg-slate-100 text-slate-600 border-slate-200",
    churned: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
        map[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function ScoreBar({
  label,
  score,
  description,
}: {
  label: string;
  score: number | undefined | null;
  description?: string;
}) {
  const value = score ?? 0;
  const color =
    value >= 70
      ? "bg-green-500"
      : value >= 40
      ? "bg-yellow-400"
      : "bg-red-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-foreground">{label}</span>
          {description && (
            <span className="text-xs text-muted-foreground ml-2">{description}</span>
          )}
        </div>
        <span
          className={`text-sm font-bold tabular-nums ${
            value >= 70
              ? "text-green-700"
              : value >= 40
              ? "text-yellow-700"
              : "text-red-700"
          }`}
        >
          {value}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function EventSourceBadge({ source }: { source: string }) {
  const map: Record<string, string> = {
    stripe: "bg-violet-100 text-violet-700",
    intercom: "bg-blue-100 text-blue-700",
    helpscout: "bg-teal-100 text-teal-700",
    zendesk: "bg-green-100 text-green-700",
    segment: "bg-pink-100 text-pink-700",
    mixpanel: "bg-purple-100 text-purple-700",
    amplitude: "bg-indigo-100 text-indigo-700",
    hubspot: "bg-orange-100 text-orange-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
        map[source] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {source}
    </span>
  );
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // Fetch all data in parallel
  const [
    { data: account },
    { data: healthScore },
    { data: scoreHistory },
    { data: contacts },
    { data: notes },
    { data: webhookEvents },
    { data: renewals },
    { data: playbookRuns },
    { data: playbooks },
  ] = await Promise.all([
    supabase
      .from("hs_accounts")
      .select(
        `
        id, name, domain, plan, mrr, arr, seats, status, segment,
        contract_start_date, renewal_date, tags, custom_fields,
        csm:profiles!hs_accounts_csm_id_fkey (
          id, full_name, email, avatar_url
        )
      `
      )
      .eq("id", id)
      .eq("organization_id", orgId)
      .single(),

    supabase
      .from("hs_health_scores")
      .select("*")
      .eq("account_id", id)
      .eq("organization_id", orgId)
      .single(),

    supabase
      .from("hs_health_score_history")
      .select("overall_score, snapshot_date")
      .eq("account_id", id)
      .eq("organization_id", orgId)
      .order("snapshot_date", { ascending: true })
      .limit(30),

    supabase
      .from("hs_contacts")
      .select("*")
      .eq("account_id", id)
      .eq("organization_id", orgId)
      .order("is_primary", { ascending: false }),

    supabase
      .from("hs_notes")
      .select(
        `
        *, author:profiles!hs_notes_author_id_fkey (
          full_name, avatar_url
        )
      `
      )
      .eq("account_id", id)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),

    supabase
      .from("hs_webhook_events")
      .select("id, event_type, source, payload, processed, created_at")
      .eq("account_id", id)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10),

    supabase
      .from("hs_renewals")
      .select("*")
      .eq("account_id", id)
      .eq("organization_id", orgId)
      .order("renewal_date", { ascending: false })
      .limit(3),

    supabase
      .from("hs_playbook_runs")
      .select(
        `
        id, status, triggered_by, actions_completed, actions_failed, created_at,
        playbook:hs_playbooks ( name )
      `
      )
      .eq("account_id", id)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("hs_playbooks")
      .select("id, name, description")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .limit(10),
  ]);

  if (!account) notFound();

  const csm = Array.isArray(account.csm)
    ? account.csm[0]
    : (account.csm as { id?: string; full_name?: string; email?: string } | null);

  const hs = healthScore;

  const trendData = (scoreHistory ?? []).map((h) => ({
    date: h.snapshot_date,
    score: h.overall_score,
  }));

  const churnPct = hs?.churn_risk ? Math.round(hs.churn_risk * 100) : null;
  const daysUntilRenewal = account.renewal_date
    ? getDaysUntil(account.renewal_date)
    : null;

  // Churn risk factors derived from component scores
  const riskFactors: string[] = [];
  if (hs) {
    if (hs.usage_score < 40) riskFactors.push("Low product usage");
    if (hs.support_score < 40) riskFactors.push("High support ticket volume");
    if (hs.billing_score < 40) riskFactors.push("Payment issues detected");
    if (hs.engagement_score < 40) riskFactors.push("Low user engagement");
    if (hs.nps_score < 40) riskFactors.push("Poor NPS/satisfaction");
    if (hs.feature_adoption_score < 40) riskFactors.push("Low feature adoption");
    if (daysUntilRenewal !== null && daysUntilRenewal <= 30 && daysUntilRenewal >= 0)
      riskFactors.push("Renewal within 30 days");
  }

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/dashboard/accounts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Accounts
      </Link>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ============================================================
            LEFT COLUMN (2/3)
        ============================================================ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account header */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-border flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-foreground">
                      {account.name}
                    </h1>
                    <StatusBadge status={account.status} />
                    <SegmentBadge segment={account.segment} />
                  </div>
                  {account.domain && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                      <a
                        href={`https://${account.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {account.domain}
                      </a>
                    </div>
                  )}
                  {account.plan && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground capitalize">
                        {account.plan} Plan
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview">
            <TabsList className="bg-white border border-border w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="contacts">
                Contacts
                {contacts && contacts.length > 0 && (
                  <span className="ml-1.5 text-xs bg-slate-200 text-slate-700 rounded-full px-1.5 py-0.5 leading-none">
                    {contacts.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="notes">
                Notes
                {notes && notes.length > 0 && (
                  <span className="ml-1.5 text-xs bg-slate-200 text-slate-700 rounded-full px-1.5 py-0.5 leading-none">
                    {notes.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ---- OVERVIEW ---- */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Health score breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Health Score Breakdown</CardTitle>
                  <CardDescription>
                    Component scores that make up the overall health score
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hs ? (
                    <>
                      <ScoreBar
                        label="Usage"
                        score={hs.usage_score}
                        description="Product usage frequency & depth"
                      />
                      <ScoreBar
                        label="Support"
                        score={hs.support_score}
                        description="Support ticket volume & resolution"
                      />
                      <ScoreBar
                        label="Billing"
                        score={hs.billing_score}
                        description="Payment history & reliability"
                      />
                      <ScoreBar
                        label="Engagement"
                        score={hs.engagement_score}
                        description="User logins & session activity"
                      />
                      <ScoreBar
                        label="NPS"
                        score={hs.nps_score}
                        description="Net Promoter Score signals"
                      />
                      <ScoreBar
                        label="Feature Adoption"
                        score={hs.feature_adoption_score}
                        description="Breadth of features used"
                      />
                      <Separator />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Last calculated:{" "}
                          {formatRelativeDate(hs.calculated_at)}
                        </span>
                        <span className="text-muted-foreground">
                          Formula v{hs.formula_version}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No health score data yet. Connect an integration to start scoring.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent events */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Recent Events</CardTitle>
                </CardHeader>
                <CardContent>
                  {webhookEvents && webhookEvents.length > 0 ? (
                    <div className="space-y-3">
                      {webhookEvents.slice(0, 5).map((evt) => (
                        <div
                          key={evt.id}
                          className="flex items-start gap-3 text-sm"
                        >
                          <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-2" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-foreground truncate">
                                {evt.event_type}
                              </span>
                              <EventSourceBadge source={evt.source} />
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {formatRelativeDate(evt.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No events yet
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Playbook runs */}
              {playbookRuns && playbookRuns.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recent Playbook Runs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {playbookRuns.map((run) => {
                        const pb = Array.isArray(run.playbook)
                          ? run.playbook[0]
                          : (run.playbook as { name?: string } | null);
                        const statusCls =
                          run.status === "completed"
                            ? "text-green-600"
                            : run.status === "failed"
                            ? "text-red-600"
                            : run.status === "running"
                            ? "text-blue-600"
                            : "text-yellow-600";
                        return (
                          <div
                            key={run.id}
                            className="flex items-center gap-3 text-sm"
                          >
                            <Zap className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1">
                              <span className="font-medium text-foreground">
                                {pb?.name ?? "Unknown playbook"}
                              </span>
                              <span className="text-muted-foreground ml-2">
                                · {run.actions_completed} actions
                              </span>
                            </div>
                            <span className={`capitalize font-medium ${statusCls}`}>
                              {run.status}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeDate(run.created_at)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ---- ACTIVITY ---- */}
            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Event Timeline</CardTitle>
                  <CardDescription>
                    Recent webhook events from your integrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {webhookEvents && webhookEvents.length > 0 ? (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
                      <div className="space-y-4 pl-10">
                        {webhookEvents.map((evt) => {
                          const payload = evt.payload as Record<string, unknown>;
                          return (
                            <div key={evt.id} className="relative">
                              {/* Dot */}
                              <div className="absolute -left-7 top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-400" />
                              <div className="bg-slate-50 rounded-lg border border-border p-3">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-foreground">
                                      {evt.event_type}
                                    </span>
                                    <EventSourceBadge source={evt.source} />
                                    {evt.processed && (
                                      <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                                        processed
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatRelativeDate(evt.created_at)}
                                  </span>
                                </div>
                                {/* Show key payload fields */}
                                {payload && Object.keys(payload).length > 0 && (
                                  <div className="mt-2 text-xs text-muted-foreground font-mono bg-white rounded border border-border px-2 py-1.5 overflow-hidden">
                                    {Object.entries(payload)
                                      .slice(0, 3)
                                      .map(([k, v]) => (
                                        <div key={k} className="truncate">
                                          <span className="text-blue-600">{k}</span>:{" "}
                                          <span>
                                            {typeof v === "object"
                                              ? JSON.stringify(v)
                                              : String(v)}
                                          </span>
                                        </div>
                                      ))}
                                    {Object.keys(payload).length > 3 && (
                                      <div className="text-slate-400">
                                        +{Object.keys(payload).length - 3} more fields
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground text-sm">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No activity yet. Connect integrations to see events.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ---- CONTACTS ---- */}
            <TabsContent value="contacts" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Contacts</CardTitle>
                  <CardDescription>
                    People at {account.name} you work with
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contacts && contacts.length > 0 ? (
                    <div className="divide-y divide-border -mx-6">
                      {contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center gap-4 px-6 py-3"
                        >
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {contact.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-foreground">
                                {contact.name}
                              </span>
                              {contact.is_primary && (
                                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                                  Primary
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              {contact.title && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {contact.title}
                                </span>
                              )}
                              {contact.email && (
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <Mail className="w-3 h-3" />
                                  {contact.email}
                                </a>
                              )}
                              {contact.phone && (
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3" />
                                  {contact.phone}
                                </a>
                              )}
                            </div>
                          </div>
                          {contact.last_active_at && (
                            <div className="text-xs text-muted-foreground text-right hidden sm:block">
                              <div>Last active</div>
                              <div className="font-medium">
                                {formatRelativeDate(contact.last_active_at)}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground text-sm">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No contacts yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ---- NOTES ---- */}
            <TabsContent value="notes" className="mt-4 space-y-4">
              {/* Add note form (client) */}
              <AccountDetailActions
                accountId={account.id}
                playbooks={playbooks ?? []}
              />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Notes & Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  {notes && notes.length > 0 ? (
                    <div className="space-y-4">
                      {notes.map((note) => {
                        const author = Array.isArray(note.author)
                          ? note.author[0]
                          : (note.author as { full_name?: string } | null);
                        const typeMap: Record<string, string> = {
                          note: "bg-slate-100 text-slate-700",
                          call: "bg-green-100 text-green-700",
                          meeting: "bg-blue-100 text-blue-700",
                          email: "bg-purple-100 text-purple-700",
                        };
                        return (
                          <div
                            key={note.id}
                            className="border border-border rounded-lg p-4"
                          >
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                                  typeMap[note.type] ??
                                  "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {note.type}
                              </span>
                              {author?.full_name && (
                                <span className="text-xs text-muted-foreground">
                                  by {author.full_name}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground ml-auto">
                                {formatRelativeDate(note.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                              {note.content}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground text-sm">
                      No notes yet. Add one above.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ============================================================
            RIGHT COLUMN (1/3)
        ============================================================ */}
        <div className="space-y-4">
          {/* Health Score Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                Health Score
                {hs && (
                  <span
                    className={`text-3xl font-bold tabular-nums ${getScoreColor(
                      hs.overall_score
                    )}`}
                  >
                    {hs.overall_score}
                  </span>
                )}
              </CardTitle>
              {hs && (
                <CardDescription>
                  {getScoreLabel(hs.overall_score)} ·{" "}
                  {formatRelativeDate(hs.calculated_at)}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <HealthTrendChart data={trendData} height={140} />
              ) : (
                <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">
                  No trend data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Churn Risk Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Churn Risk</CardTitle>
            </CardHeader>
            <CardContent>
              {hs ? (
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div
                      className={`text-3xl font-bold tabular-nums ${getChurnRiskColor(
                        hs.churn_risk_label
                      )}`}
                    >
                      {churnPct}%
                    </div>
                    <span
                      className={`text-sm font-medium capitalize px-2.5 py-1 rounded-full border ${
                        hs.churn_risk_label === "critical"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : hs.churn_risk_label === "high"
                          ? "bg-orange-50 text-orange-700 border-orange-200"
                          : hs.churn_risk_label === "medium"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }`}
                    >
                      {hs.churn_risk_label}
                    </span>
                  </div>
                  {/* Risk bar */}
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        (churnPct ?? 0) >= 70
                          ? "bg-red-500"
                          : (churnPct ?? 0) >= 40
                          ? "bg-orange-400"
                          : (churnPct ?? 0) >= 20
                          ? "bg-yellow-400"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${churnPct ?? 0}%` }}
                    />
                  </div>
                  {riskFactors.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Key Risk Factors
                      </p>
                      {riskFactors.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs text-foreground"
                        >
                          <div className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No prediction yet</p>
              )}
            </CardContent>
          </Card>

          {/* Account Details Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> MRR
                  </dt>
                  <dd className="font-semibold tabular-nums">
                    {formatMRR(account.mrr)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> ARR
                  </dt>
                  <dd className="font-semibold tabular-nums">
                    {formatMRR(account.arr)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Seats
                  </dt>
                  <dd className="font-semibold tabular-nums">{account.seats}</dd>
                </div>
                {account.plan && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> Plan
                    </dt>
                    <dd className="font-medium capitalize">{account.plan}</dd>
                  </div>
                )}
                {csm && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> CSM
                    </dt>
                    <dd className="font-medium">{csm.full_name ?? csm.email}</dd>
                  </div>
                )}
                {account.contract_start_date && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Start Date
                    </dt>
                    <dd className="font-medium">
                      {formatDate(account.contract_start_date)}
                    </dd>
                  </div>
                )}
                {account.renewal_date && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Renewal
                    </dt>
                    <dd>
                      <span
                        className={`font-medium ${
                          daysUntilRenewal !== null && daysUntilRenewal <= 30
                            ? "text-orange-600"
                            : "text-foreground"
                        }`}
                      >
                        {formatDate(account.renewal_date)}
                      </span>
                      {daysUntilRenewal !== null && (
                        <span className="text-xs text-muted-foreground ml-1.5">
                          ({daysUntilRenewal > 0
                            ? `${daysUntilRenewal}d away`
                            : `${Math.abs(daysUntilRenewal)}d overdue`})
                        </span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Quick Actions (Client) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <AccountDetailActions
                accountId={account.id}
                playbooks={playbooks ?? []}
                variant="actions"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
