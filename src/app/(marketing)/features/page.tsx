import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Features",
  description: "10 powerful features for customer health scoring: real-time health scores, churn prediction, Slack alerts, automated playbooks, custom formulas, and more.",
};
import {
  Activity,
  Bell,
  BarChart2,
  Zap,
  Users,
  TrendingDown,
  Settings,
  Globe,
  Mail,
  Shield,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    name: "Real-time Health Scores",
    description: [
      "HealthScore calculates a live health score for every account in your portfolio, updated automatically as data flows in from your connected tools. Unlike manual spreadsheets or quarterly reviews, HealthScore gives you a single number — from 0 to 100 — that tells you exactly how healthy each customer relationship is, right now.",
      "Health scores are composed from multiple signals: product usage, support ticket volume, billing history, NPS responses, and engagement metrics. You control how these signals are weighted, so your score formula reflects what actually drives retention in your business.",
      "Score changes are tracked over time so you can see trends, not just snapshots. A customer trending from 65 to 45 over three weeks tells a very different story than one sitting steadily at 45.",
    ],
    benefits: [
      "Single score for every account, updated in real time",
      "Multi-signal scoring across usage, support, billing and engagement",
      "Score history and trend analysis",
      "Configurable score thresholds for your business",
    ],
    mockup: (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Account Health Scores
        </p>
        {[
          { name: "Acme Corp", score: 87, trend: "+4" },
          { name: "Globex Inc", score: 43, trend: "-12" },
          { name: "Initech Ltd", score: 22, trend: "-8" },
          { name: "Umbrella Co", score: 91, trend: "+2" },
          { name: "Wonka Industries", score: 68, trend: "+1" },
        ].map((a) => (
          <div key={a.name} className="flex items-center gap-3 py-2">
            <span className="w-32 text-sm text-gray-700">{a.name}</span>
            <div className="flex-1 h-2 rounded-full bg-gray-100">
              <div
                className={`h-2 rounded-full ${
                  a.score >= 70
                    ? "bg-green-500"
                    : a.score >= 40
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${a.score}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-900 w-6">{a.score}</span>
            <span
              className={`text-xs font-medium w-10 text-right ${
                a.trend.startsWith("+") ? "text-green-600" : "text-red-500"
              }`}
            >
              {a.trend}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: TrendingDown,
    name: "Churn Prediction",
    description: [
      "HealthScore's churn prediction engine analyses patterns across your entire customer base to surface accounts that are at high risk of cancelling — often weeks before they send the cancellation email. By identifying these signals early, your CS team has time to intervene.",
      "The prediction model looks at leading indicators like declining login frequency, shrinking feature breadth, unresolved support tickets, failed payment attempts, and reduced team seat usage. These weak signals, combined, are far more accurate than any single data point.",
      "Each at-risk account gets a churn risk label (Low / Medium / High / Critical) along with the specific signals driving that risk. Your team knows not just who is at risk, but exactly why — so they can have the right conversation.",
    ],
    benefits: [
      "ML-powered churn risk labelling (Low / Medium / High / Critical)",
      "Leading indicator analysis across all connected data sources",
      "Risk driver explanations so CSMs know what to address",
      "Weekly at-risk account digest",
    ],
    mockup: (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Churn Risk Signals
        </p>
        {[
          { signal: "Login frequency down 60%", severity: "high" },
          { signal: "3 unresolved support tickets", severity: "medium" },
          { signal: "Feature usage dropped", severity: "high" },
          { signal: "Payment failed last cycle", severity: "critical" },
        ].map((s) => (
          <div key={s.signal} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
            <span
              className={`inline-block h-2 w-2 rounded-full shrink-0 ${
                s.severity === "critical"
                  ? "bg-red-500"
                  : s.severity === "high"
                  ? "bg-orange-500"
                  : "bg-yellow-500"
              }`}
            />
            <span className="text-sm text-gray-700">{s.signal}</span>
            <span
              className={`ml-auto text-xs font-semibold capitalize ${
                s.severity === "critical"
                  ? "text-red-600"
                  : s.severity === "high"
                  ? "text-orange-600"
                  : "text-yellow-600"
              }`}
            >
              {s.severity}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Bell,
    name: "Slack Alerts",
    description: [
      "When a customer's health score drops below a threshold you define, HealthScore fires an instant Slack alert to the right channel or person. Your CS team sees the warning in real time — not on a weekly report that's already a week late.",
      "Alerts are fully configurable. Set separate thresholds for different account tiers (e.g., enterprise accounts alert at score 60, standard accounts at score 40). Route alerts to a shared CS channel, or directly message the account owner.",
      "Each alert includes the account name, current score, previous score, the specific signals that triggered the drop, and a one-click link to the account detail page. Your team has everything they need to act, right inside Slack.",
    ],
    benefits: [
      "Instant Slack DM or channel alerts on score drops",
      "Configurable thresholds per account tier",
      "Alert routing by account owner",
      "Rich alert cards with score delta and signal breakdown",
    ],
    mockup: (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm font-mono text-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
            S
          </div>
          <span className="font-semibold text-gray-800 not-italic">
            HealthScore Bot
          </span>
          <span className="text-gray-400">App</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-red-500">
          <p className="font-bold text-gray-900 not-italic text-sm">
            🚨 Health Score Alert: Initech Ltd
          </p>
          <p className="text-gray-600 mt-1 not-italic">
            Score dropped from <strong>58 → 22</strong> in the last 24h
          </p>
          <p className="text-gray-500 mt-1 not-italic">
            Risk signals: Login frequency down 60%, payment failed
          </p>
          <button className="mt-2 rounded bg-blue-600 text-white px-3 py-1 text-xs not-italic">
            View Account →
          </button>
        </div>
      </div>
    ),
  },
  {
    icon: BarChart2,
    name: "Custom Score Formulas",
    description: [
      "Every business is different. A product-led growth company weights feature adoption heavily. An enterprise SaaS might weight executive engagement and NPS above all else. HealthScore lets you define your own formula — no engineering required.",
      "Using the drag-and-drop formula builder, you assign weights to each signal category: usage, support, billing, engagement, NPS, and feature adoption. HealthScore recalculates all historical scores immediately, so you can see how a formula change affects your entire portfolio.",
      "You can create multiple formulas — for example, one formula for SMB accounts and a different one for enterprise — and assign them automatically based on account tier or segment.",
    ],
    benefits: [
      "Drag-and-drop formula builder",
      "Weight any combination of signals",
      "Multiple formulas for different account segments",
      "Historical score recalculation on formula change",
    ],
    mockup: (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Score Formula Builder
        </p>
        {[
          { label: "Product Usage", weight: 35, color: "bg-blue-500" },
          { label: "Support Health", weight: 25, color: "bg-purple-500" },
          { label: "Billing Status", weight: 20, color: "bg-green-500" },
          { label: "NPS Score", weight: 15, color: "bg-yellow-500" },
          { label: "Engagement", weight: 5, color: "bg-orange-500" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 py-2">
            <span className="w-32 text-sm text-gray-600">{item.label}</span>
            <div className="flex-1 h-3 rounded-full bg-gray-100">
              <div
                className={`h-3 rounded-full ${item.color}`}
                style={{ width: `${item.weight * 2}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-900 w-10 text-right">
              {item.weight}%
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Users,
    name: "Customer Segmentation",
    description: [
      "Automatically segment every account into Green (healthy), Yellow (at risk), or Red (critical) buckets based on their health score. Your team always knows where to focus their energy without manually triaging a list.",
      "Segmentation is dynamic — accounts move between segments automatically as their score changes. When an account drops into Red, it appears immediately in your critical accounts queue.",
      "You can also create custom segments based on any combination of attributes: account tier, MRR, industry, product, CSM owner, or any custom field. Filter your account list to see exactly the slice of your portfolio you care about.",
    ],
    benefits: [
      "Automatic Green / Yellow / Red segmentation",
      "Dynamic — segments update in real time",
      "Custom segments based on any account attribute",
      "Segment-level analytics and reporting",
    ],
    mockup: (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Healthy", count: 143, pct: "72%", color: "bg-green-50 border-green-200 text-green-700" },
            { label: "At Risk", count: 38, pct: "19%", color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
            { label: "Critical", count: 18, pct: "9%", color: "bg-red-50 border-red-200 text-red-700" },
          ].map((seg) => (
            <div key={seg.label} className={`rounded-lg border p-4 text-center ${seg.color}`}>
              <p className="text-2xl font-bold">{seg.count}</p>
              <p className="text-xs font-semibold mt-1">{seg.label}</p>
              <p className="text-xs opacity-75 mt-0.5">{seg.pct}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Zap,
    name: "Automated Playbooks",
    description: [
      "Playbooks let you define automated workflows that trigger when health conditions are met. When an account drops into Red, automatically create a task for the CSM, send them a briefing email, and flag the account for executive review — without anyone lifting a finger.",
      "Playbooks are built with a simple condition/action editor. Conditions can check score ranges, segment changes, individual signal values, or time-based rules (e.g., \"account has been in Yellow for more than 14 days\"). Actions include internal notifications, email sends, task creation, and webhook calls to external systems.",
      "Every playbook run is logged, so you have a full audit trail of every automated action taken across your portfolio.",
    ],
    benefits: [
      "Condition-based triggers on score, segment, or individual signals",
      "Actions: notify, email, create task, call webhook",
      "Full audit log of all playbook executions",
      "Multi-step playbook sequences",
    ],
    mockup: (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Churn Risk Playbook
        </p>
        <div className="space-y-3">
          {[
            { type: "TRIGGER", label: "Score drops below 30", icon: "⚡" },
            { type: "ACTION", label: "Alert CSM via Slack", icon: "💬" },
            { type: "ACTION", label: "Create follow-up task", icon: "✅" },
            { type: "ACTION", label: "Flag for exec review", icon: "🚩" },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-lg">{step.icon}</span>
              <div className="flex-1">
                <span
                  className={`text-xs font-bold uppercase ${
                    step.type === "TRIGGER" ? "text-purple-600" : "text-blue-600"
                  }`}
                >
                  {step.type}
                </span>
                <p className="text-sm text-gray-700">{step.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Globe,
    name: "Integration Hub",
    description: [
      "HealthScore connects to the tools your team already uses, pulling in the data signals that matter for customer health. No complex ETL pipelines, no data engineering team needed — just OAuth connections that take minutes to set up.",
      "Available integrations include Stripe (billing and MRR), Intercom and Zendesk (support tickets), HelpScout (email support), Mixpanel, Amplitude, and Segment (product analytics), HubSpot (CRM data), and many more. New integrations are added every month.",
      "For data sources without a native integration, HealthScore supports custom webhooks and a REST API so your engineering team can pipe in any data you want.",
    ],
    benefits: [
      "20+ native integrations, new ones added monthly",
      "OAuth-based setup in minutes",
      "Custom webhooks for any data source",
      "REST API for full flexibility",
    ],
    mockup: (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Connected Integrations
        </p>
        <div className="flex flex-wrap gap-2">
          {["Stripe", "Intercom", "Zendesk", "HelpScout", "Mixpanel", "Amplitude", "Segment", "HubSpot"].map(
            (name) => (
              <span
                key={name}
                className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
              >
                ✓ {name}
              </span>
            )
          )}
        </div>
      </div>
    ),
  },
  {
    icon: Mail,
    name: "Email Digest",
    description: [
      "Your CS team receives a daily and weekly email digest summarising the health of your entire customer portfolio. No login required to stay up to date — the most important information comes to you.",
      "The daily digest highlights accounts whose scores changed significantly overnight, any new Red accounts, and any accounts moving in the right direction after intervention. The weekly digest provides a broader portfolio view with trend charts and key metrics.",
      "Digests can be configured per team member, so each CSM only sees the accounts they own. Managers can subscribe to portfolio-wide digests.",
    ],
    benefits: [
      "Daily and weekly automated email summaries",
      "Per-CSM account filtering",
      "Score change highlights and trend summaries",
      "Manager-level portfolio digest option",
    ],
    mockup: (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="border-b border-gray-100 pb-3 mb-3">
          <p className="text-xs text-gray-400">From: HealthScore Digest</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            Your daily portfolio summary — 3 accounts need attention
          </p>
        </div>
        <div className="space-y-2">
          {[
            { name: "Initech Ltd", change: "58 → 22", direction: "down" },
            { name: "Globex Inc", change: "71 → 88", direction: "up" },
            { name: "Cyberdyne", change: "49 → 31", direction: "down" },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{item.name}</span>
              <span
                className={`font-semibold ${
                  item.direction === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {item.direction === "up" ? "↑" : "↓"} {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Settings,
    name: "CSM Workspaces",
    description: [
      "Each Customer Success Manager on your team gets their own workspace inside HealthScore — a personalised view showing only the accounts they own, their own task list, alert inbox, and performance metrics.",
      "Managers get an additional portfolio view that shows all accounts and all CSMs, with the ability to reassign accounts, compare CSM performance, and see which team members have the most at-risk books.",
      "Workspaces scale from solo CS operators to large enterprise teams with hundreds of CSMs. Role-based permissions ensure the right people see the right data.",
    ],
    benefits: [
      "Individual CSM dashboards filtered to their accounts",
      "Manager portfolio view across all CSMs",
      "Account assignment and ownership management",
      "Role-based access control (Admin / Manager / CSM)",
    ],
    mockup: (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          CSM Workspace
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "My Accounts", value: "47" },
            { label: "Avg Score", value: "71" },
            { label: "At Risk", value: "8" },
            { label: "Tasks Due", value: "3" },
          ].map((m) => (
            <div key={m.label} className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-400">{m.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Shield,
    name: "Data Privacy Controls",
    description: [
      "HealthScore is built for global businesses. We comply with the Australian Privacy Act 1988, UK GDPR, Canadian PIPEDA, the New Zealand Privacy Act 2020, and the California Consumer Privacy Act (CCPA). Your customers' data is handled lawfully and transparently wherever they are.",
      "Granular data retention controls let you define exactly how long different categories of data are kept. All data is encrypted in transit and at rest. We use Supabase (PostgreSQL) for data storage with row-level security, ensuring complete tenant isolation.",
      "HealthScore undergoes regular security audits. We maintain a public security page with our policies and responsible disclosure contact. For enterprise customers, we can provide BAAs, data processing agreements, and custom data residency arrangements.",
    ],
    benefits: [
      "GDPR, CCPA, Australian Privacy Act, PIPEDA and NZ Privacy Act compliant",
      "Configurable data retention policies",
      "Encryption at rest and in transit",
      "Row-level security and full tenant data isolation",
    ],
    mockup: (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Compliance Status
        </p>
        <div className="space-y-2">
          {[
            "Australian Privacy Act 1988",
            "UK GDPR",
            "CCPA (California)",
            "PIPEDA (Canada)",
            "NZ Privacy Act 2020",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              <span className="text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

const integrations = [
  "Stripe",
  "Intercom",
  "HelpScout",
  "Zendesk",
  "Segment",
  "Mixpanel",
  "Amplitude",
  "HubSpot",
];

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-blue-950 text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl">
            Everything you need to stop churn
          </h1>
          <p className="mt-6 text-xl text-slate-300 max-w-2xl mx-auto">
            HealthScore brings together real-time health scoring, churn prediction, automated alerts, and playbooks in one platform built for Customer Success teams.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              Start for free
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold text-white hover:bg-white/20 transition-colors"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Feature detail sections */}
      <div className="divide-y divide-gray-100">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          const isEven = idx % 2 === 0;
          return (
            <section
              key={feature.name}
              className={`py-20 ${isEven ? "bg-white" : "bg-gray-50"}`}
              id={feature.name.toLowerCase().replace(/\s+/g, "-")}
            >
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-start ${!isEven ? "lg:flex-row-reverse" : ""}`}>
                  <div className={!isEven ? "lg:order-2" : ""}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 mb-6">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">{feature.name}</h2>
                    <div className="mt-4 space-y-4">
                      {feature.description.map((para, i) => (
                        <p key={i} className="text-gray-600 leading-relaxed">
                          {para}
                        </p>
                      ))}
                    </div>
                    <ul className="mt-6 space-y-2">
                      {feature.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={!isEven ? "lg:order-1" : ""}>{feature.mockup}</div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Integrations */}
      <section className="py-20 bg-white" id="integrations">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Works with your existing stack</h2>
          <p className="mt-4 text-gray-600">Connect your tools in minutes with no-code OAuth integrations.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {integrations.map((name) => (
              <div
                key={name}
                className="rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:border-blue-300 hover:text-blue-700 transition-colors"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold">
            Ready to see HealthScore in action?
          </h2>
          <p className="mt-4 text-xl text-blue-100">
            Set up in 5 minutes. No credit card required.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Start for free
          </Link>
        </div>
      </section>
    </>
  );
}
