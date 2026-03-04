import Link from "next/link";
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
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    name: "Real-time Health Scores",
    description:
      "Live health scores for every account, updated automatically as data flows in from your connected tools.",
  },
  {
    icon: TrendingDown,
    name: "Churn Prediction",
    description:
      "ML-powered churn risk signals that surface at-risk accounts weeks before they cancel.",
  },
  {
    icon: Bell,
    name: "Slack Alerts",
    description:
      "Instant Slack notifications when a customer's health score drops, so your team can act fast.",
  },
  {
    icon: BarChart2,
    name: "Custom Score Formulas",
    description:
      "Build your own health score formula by weighting usage, support, billing, and engagement signals.",
  },
  {
    icon: Users,
    name: "Customer Segmentation",
    description:
      "Automatically segment customers into Green / Yellow / Red buckets based on their score.",
  },
  {
    icon: Zap,
    name: "Automated Playbooks",
    description:
      "Trigger workflows automatically when health conditions are met — no manual intervention needed.",
  },
  {
    icon: Globe,
    name: "Integration Hub",
    description:
      "Connect Stripe, Intercom, Zendesk, Mixpanel, and 20+ other tools in minutes with no-code connectors.",
  },
  {
    icon: Mail,
    name: "Email Digest",
    description:
      "Daily and weekly email summaries of your portfolio health, delivered to your inbox.",
  },
  {
    icon: Settings,
    name: "CSM Workspaces",
    description:
      "Dedicated workspaces for each CSM with their own account list, alerts, and performance metrics.",
  },
  {
    icon: Shield,
    name: "Data Privacy Controls",
    description:
      "Full GDPR, CCPA, and Australian Privacy Act compliance with granular data retention controls.",
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

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "For early-stage teams",
    features: ["Up to 25 accounts", "3 integrations", "Basic health scores", "Email alerts"],
    cta: "Get started",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
    description: "For growing CS teams",
    features: ["Up to 200 accounts", "10 integrations", "Custom score formulas", "Slack alerts", "CSV export"],
    cta: "Start free trial",
    href: "/signup?plan=starter",
    highlighted: true,
  },
  {
    name: "Growth",
    price: "$99",
    period: "/mo",
    description: "For scaling businesses",
    features: ["Up to 1,000 accounts", "Unlimited integrations", "Automated playbooks", "CSM workspaces", "API access"],
    cta: "Start free trial",
    href: "/signup?plan=growth",
    highlighted: false,
  },
];

const testimonials = [
  {
    quote:
      "HealthScore flagged three at-risk accounts we had no idea about. We saved all three. ROI paid for itself in the first week.",
    author: "Sarah Chen",
    role: "Head of Customer Success",
    company: "Growthly",
  },
  {
    quote:
      "We migrated from Gainsight and set up HealthScore in an afternoon. No professional services, no 6-month onboarding. It just works.",
    author: "Marcus Webb",
    role: "VP Customer Success",
    company: "DataSync",
  },
  {
    quote:
      "The Slack alerts alone are worth the price. My team catches churn signals immediately instead of finding out on a quarterly review.",
    author: "Priya Nair",
    role: "Customer Success Manager",
    company: "FlowStack",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300 mb-8">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              Trusted by 500+ customer success teams
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
              Know which customers are about to churn{" "}
              <span className="text-blue-400">— before they do</span>
            </h1>
            <p className="mt-6 text-xl text-slate-300 leading-relaxed max-w-2xl">
              HealthScore gives you instant visibility into every account.
              Connect your data, get health scores, stop churn.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-500 transition-colors"
              >
                Start for free
              </Link>
              <Link
                href="/features"
                className="rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold text-white hover:bg-white/20 transition-colors"
              >
                See how it works
              </Link>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="mt-16 rounded-2xl border border-white/10 bg-slate-800/80 backdrop-blur p-6 shadow-2xl max-w-4xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="ml-2 text-xs text-slate-400">HealthScore Dashboard</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="rounded-lg bg-slate-700/60 p-4">
                <p className="text-xs text-slate-400 mb-1">Avg Health Score</p>
                <p className="text-2xl font-bold text-green-400">74</p>
                <p className="text-xs text-green-400 mt-1">+3 this week</p>
              </div>
              <div className="rounded-lg bg-slate-700/60 p-4">
                <p className="text-xs text-slate-400 mb-1">At Risk Accounts</p>
                <p className="text-2xl font-bold text-yellow-400">12</p>
                <p className="text-xs text-yellow-400 mt-1">Needs attention</p>
              </div>
              <div className="rounded-lg bg-slate-700/60 p-4">
                <p className="text-xs text-slate-400 mb-1">Critical</p>
                <p className="text-2xl font-bold text-red-400">3</p>
                <p className="text-xs text-red-400 mt-1">Churn risk high</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { name: "Acme Corp", score: 87, status: "Healthy", color: "bg-green-500" },
                { name: "Globex Inc", score: 43, status: "At Risk", color: "bg-yellow-500" },
                { name: "Initech Ltd", score: 22, status: "Critical", color: "bg-red-500" },
                { name: "Umbrella Co", score: 91, status: "Healthy", color: "bg-green-500" },
              ].map((account) => (
                <div
                  key={account.name}
                  className="flex items-center justify-between rounded-lg bg-slate-700/40 px-4 py-2.5"
                >
                  <span className="text-sm text-slate-200">{account.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 rounded-full bg-slate-600">
                      <div
                        className={`h-2 rounded-full ${account.color}`}
                        style={{ width: `${account.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-200 w-6 text-right">
                      {account.score}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        account.status === "Healthy"
                          ? "bg-green-900/50 text-green-400"
                          : account.status === "At Risk"
                          ? "bg-yellow-900/50 text-yellow-400"
                          : "bg-red-900/50 text-red-400"
                      }`}
                    >
                      {account.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Setup in 5 minutes */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Setup in 5 minutes
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              No professional services. No 6-month onboarding. Just connect and go.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector lines (desktop) */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-blue-200" />
            {[
              {
                step: "1",
                icon: "🔌",
                title: "Connect your tools",
                description:
                  "Link Stripe, Intercom, Zendesk, and your other tools in one click. No code needed.",
              },
              {
                step: "2",
                icon: "⚡",
                title: "Auto-generate scores",
                description:
                  "HealthScore instantly calculates health scores for every account using your data.",
              },
              {
                step: "3",
                icon: "🔔",
                title: "Get Slack alerts",
                description:
                  "Receive instant alerts when accounts drop so your team can intervene in time.",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white border-2 border-blue-100 shadow-sm text-3xl mb-6">
                  {item.icon}
                </div>
                <div className="absolute top-7 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 bg-white" id="features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything you need to stop churn
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              HealthScore brings together all the tools your CS team needs in one simple, powerful platform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.name}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="mt-4 font-semibold text-gray-900">{feature.name}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
            >
              See all features <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 bg-gray-50" id="integrations">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Works with your existing tools
            </h2>
            <p className="mt-4 text-gray-600">
              Connect the tools you already use in minutes.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
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

      {/* Pricing teaser */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start free. Scale when you&apos;re ready.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? "bg-blue-600 text-white shadow-xl ring-4 ring-blue-200"
                    : "border border-gray-200 bg-white"
                }`}
              >
                <h3
                  className={`text-lg font-bold ${
                    plan.highlighted ? "text-white" : "text-gray-900"
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    plan.highlighted ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {plan.description}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span
                    className={`text-4xl font-extrabold ${
                      plan.highlighted ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ${
                      plan.highlighted ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>
                <ul className="mt-6 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle
                        className={`h-4 w-4 shrink-0 ${
                          plan.highlighted ? "text-blue-200" : "text-blue-600"
                        }`}
                      />
                      <span className={plan.highlighted ? "text-blue-50" : "text-gray-600"}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-8 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
            >
              View full pricing details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">
              Social proof
            </p>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Trusted by 500+ CS teams
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">
                      ★
                    </span>
                  ))}
                </div>
                <blockquote className="text-gray-700 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {t.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                    <p className="text-xs text-gray-500">
                      {t.role}, {t.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Ready to reduce churn?
          </h2>
          <p className="mt-4 text-xl text-blue-100">
            Join 500+ CS teams using HealthScore to keep their customers happy and their MRR growing.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-white px-8 py-3 text-base font-semibold text-blue-600 shadow-lg hover:bg-blue-50 transition-colors"
            >
              Start for free — no credit card required
            </Link>
          </div>
          <p className="mt-4 text-sm text-blue-200">
            Free plan available. Paid plans from $49/mo.
          </p>
        </div>
      </section>
    </>
  );
}
