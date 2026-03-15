"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle,
  ChevronRight,
  Link2,
  Play,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Demo walkthrough steps
const DEMO_STEPS = [
  {
    id: 1,
    title: "Connect your data sources",
    subtitle: "PulseMetrics connects their CRM and billing data",
    icon: Link2,
    color: "text-blue-600 bg-blue-100",
  },
  {
    id: 2,
    title: "Real-time health scores",
    subtitle: "HealthScore calculates a real-time health score for every customer",
    icon: BarChart3,
    color: "text-green-600 bg-green-100",
  },
  {
    id: 3,
    title: "AI predicts churn risk",
    subtitle: "AI predicts which 12 customers are at risk of churning this month",
    icon: Brain,
    color: "text-purple-600 bg-purple-100",
  },
  {
    id: 4,
    title: "Automated playbooks trigger",
    subtitle: "At-risk customers get check-in emails, CSMs get alerts",
    icon: Zap,
    color: "text-orange-600 bg-orange-100",
  },
  {
    id: 5,
    title: "Churn drops from 15% to 8%",
    subtitle: "After 3 months, PulseMetrics reduces churn by nearly half",
    icon: TrendingDown,
    color: "text-emerald-600 bg-emerald-100",
  },
];

type Industry = "saas" | "ecommerce" | "agency";

const INDUSTRY_DATA: Record<Industry, {
  company: string;
  customers: number;
  churnBefore: number;
  churnAfter: number;
  atRisk: number;
  mrrSaved: string;
  integrations: string[];
  accounts: {
    name: string;
    score: number;
    risk: string;
    mrr: string;
    trend: "up" | "down" | "stable";
  }[];
}> = {
  saas: {
    company: "PulseMetrics",
    customers: 200,
    churnBefore: 15,
    churnAfter: 8,
    atRisk: 12,
    mrrSaved: "$47,200",
    integrations: ["Stripe", "Intercom", "Segment"],
    accounts: [
      { name: "Acme Corp", score: 91, risk: "low", mrr: "$4,500", trend: "up" },
      { name: "TechFlow Inc", score: 74, risk: "low", mrr: "$2,200", trend: "stable" },
      { name: "DataSync Labs", score: 52, risk: "medium", mrr: "$890", trend: "down" },
      { name: "CloudMetrics", score: 31, risk: "critical", mrr: "$1,800", trend: "down" },
      { name: "GrowthLab", score: 88, risk: "low", mrr: "$6,200", trend: "up" },
      { name: "NovaPay", score: 45, risk: "high", mrr: "$3,100", trend: "down" },
    ],
  },
  ecommerce: {
    company: "ShopVault",
    customers: 350,
    churnBefore: 22,
    churnAfter: 11,
    atRisk: 18,
    mrrSaved: "$63,500",
    integrations: ["Stripe", "Shopify", "Zendesk"],
    accounts: [
      { name: "FreshGoods Co", score: 87, risk: "low", mrr: "$3,200", trend: "up" },
      { name: "UrbanStyle", score: 69, risk: "medium", mrr: "$1,800", trend: "stable" },
      { name: "PetSupply Pro", score: 44, risk: "high", mrr: "$2,100", trend: "down" },
      { name: "GreenLeaf Market", score: 28, risk: "critical", mrr: "$4,600", trend: "down" },
      { name: "LuxeHome", score: 93, risk: "low", mrr: "$5,400", trend: "up" },
      { name: "DigitalPrints", score: 38, risk: "high", mrr: "$1,400", trend: "down" },
    ],
  },
  agency: {
    company: "CreativeForge",
    customers: 80,
    churnBefore: 18,
    churnAfter: 9,
    atRisk: 8,
    mrrSaved: "$28,800",
    integrations: ["HubSpot", "Intercom", "Stripe"],
    accounts: [
      { name: "BrandCo", score: 85, risk: "low", mrr: "$8,500", trend: "up" },
      { name: "MediaFirst", score: 71, risk: "low", mrr: "$5,200", trend: "stable" },
      { name: "AdVenture", score: 48, risk: "high", mrr: "$3,800", trend: "down" },
      { name: "PixelPerfect", score: 33, risk: "critical", mrr: "$6,100", trend: "down" },
      { name: "GrowthEngine", score: 90, risk: "low", mrr: "$12,000", trend: "up" },
      { name: "StartupBoost", score: 55, risk: "medium", mrr: "$2,900", trend: "down" },
    ],
  },
};

function getScoreColor(score: number) {
  if (score >= 70) return "text-green-700 bg-green-50 border-green-200";
  if (score >= 40) return "text-yellow-700 bg-yellow-50 border-yellow-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function getRiskBadge(risk: string) {
  const map: Record<string, string> = {
    low: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    critical: "bg-red-100 text-red-800 border-red-200",
  };
  return map[risk] ?? "bg-gray-100 text-gray-800";
}

export default function DemoPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [industry, setIndustry] = useState<Industry>("saas");
  const data = INDUSTRY_DATA[industry];

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 mb-6">
            <Play className="w-3.5 h-3.5" />
            Interactive Demo
          </div>
          <h1 className="text-4xl font-extrabold sm:text-5xl text-gray-900">
            See HealthScore in action
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Watch how {data.company} reduced churn from {data.churnBefore}% to{" "}
            {data.churnAfter}% with real-time health scoring and AI predictions
          </p>

          {/* Industry switcher */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {(["saas", "ecommerce", "agency"] as Industry[]).map((ind) => (
              <button
                key={ind}
                onClick={() => { setIndustry(ind); setActiveStep(1); }}
                className={cn(
                  "cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  industry === ind
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                )}
              >
                {ind === "saas" ? "SaaS" : ind === "ecommerce" ? "eCommerce" : "Agency"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Demo walkthrough */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Step navigation */}
          <div className="flex items-center justify-center gap-1 mb-12 flex-wrap">
            {DEMO_STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  "cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeStep === step.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                  {step.id}
                </span>
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            ))}
          </div>

          {/* Step content */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Step header */}
            <div className="bg-gray-50 border-b border-gray-200 px-8 py-5">
              <div className="flex items-center gap-3">
                {(() => {
                  const step = DEMO_STEPS.find((s) => s.id === activeStep)!;
                  const Icon = step.icon;
                  return (
                    <>
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", step.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{step.title}</h3>
                        <p className="text-sm text-gray-500">{step.subtitle}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Step visualization */}
            <div className="p-8">
              {activeStep === 1 && <StepIntegrations data={data} />}
              {activeStep === 2 && <StepDashboard data={data} />}
              {activeStep === 3 && <StepChurnPrediction data={data} />}
              {activeStep === 4 && <StepPlaybooks data={data} />}
              {activeStep === 5 && <StepResults data={data} />}
            </div>

            {/* Step navigation */}
            <div className="border-t border-gray-200 bg-gray-50 px-8 py-4 flex items-center justify-between">
              <button
                onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                disabled={activeStep === 1}
                className="cursor-pointer text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {activeStep < 5 ? (
                <button
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="cursor-pointer flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Next step <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  href="/signup"
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Start free <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold">Ready to reduce churn?</h2>
          <p className="mt-4 text-xl text-blue-100">
            Start free — up to 100 customers. No credit card required.
          </p>
          <Link
            href="/signup"
            className="cursor-pointer mt-8 inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Start Free — Up to 100 Customers
          </Link>
        </div>
      </section>
    </>
  );
}

// Step 1: Integration Setup
function StepIntegrations({ data }: { data: typeof INDUSTRY_DATA.saas }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {data.integrations.map((integration, idx) => (
        <div
          key={integration}
          className="border border-gray-200 rounded-xl p-6 text-center"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Link2 className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900">{integration}</h4>
          <p className="text-sm text-gray-500 mt-1">
            {idx === 0 ? "Billing data" : idx === 1 ? "Support data" : "Usage analytics"}
          </p>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            Connected
          </div>
        </div>
      ))}
      <div className="col-span-full text-center pt-4">
        <p className="text-sm text-gray-500">
          {data.company} connected {data.integrations.length} data sources in under 5 minutes
        </p>
      </div>
    </div>
  );
}

// Step 2: Dashboard with scores
function StepDashboard({ data }: { data: typeof INDUSTRY_DATA.saas }) {
  const greenCount = data.accounts.filter((a) => a.score >= 70).length;
  const yellowCount = data.accounts.filter((a) => a.score >= 40 && a.score < 70).length;
  const redCount = data.accounts.filter((a) => a.score < 40).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="text-sm text-gray-500">Total Customers</div>
          <div className="text-2xl font-bold text-gray-900">{data.customers}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="text-sm text-green-600">Healthy</div>
          <div className="text-2xl font-bold text-green-700">{greenCount}</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <div className="text-sm text-yellow-600">At Risk</div>
          <div className="text-2xl font-bold text-yellow-700">{yellowCount}</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="text-sm text-red-600">Critical</div>
          <div className="text-2xl font-bold text-red-700">{redCount}</div>
        </div>
      </div>

      {/* Account table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Account</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Score</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Risk</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">MRR</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Trend</th>
            </tr>
          </thead>
          <tbody>
            {data.accounts.map((account) => (
              <tr key={account.name} className="border-b border-gray-100 last:border-0">
                <td className="py-3 px-4 font-medium text-gray-900">{account.name}</td>
                <td className="py-3 px-4 text-center">
                  <span className={cn("inline-flex items-center justify-center w-10 h-7 rounded-md border text-sm font-bold tabular-nums", getScoreColor(account.score))}>
                    {account.score}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize border", getRiskBadge(account.risk))}>
                    {account.risk}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-medium text-gray-900 tabular-nums">{account.mrr}</td>
                <td className="py-3 px-4 text-center">
                  {account.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mx-auto" />
                  ) : account.trend === "down" ? (
                    <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />
                  ) : (
                    <span className="text-gray-400 text-xs">Stable</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Step 3: AI Churn Prediction
function StepChurnPrediction({ data }: { data: typeof INDUSTRY_DATA.saas }) {
  const atRiskAccounts = data.accounts
    .filter((a) => a.risk === "critical" || a.risk === "high")
    .sort((a, b) => a.score - b.score);

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 flex items-start gap-3">
        <Brain className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-medium text-purple-900">AI Analysis Complete</div>
          <div className="text-sm text-purple-700 mt-0.5">
            Identified {data.atRisk} accounts at risk of churning this month, representing{" "}
            {data.mrrSaved} in MRR
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {atRiskAccounts.map((account) => (
          <div key={account.name} className="border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{account.name}</h4>
                <p className="text-sm text-gray-500">{account.mrr}/mo</p>
              </div>
              <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize border", getRiskBadge(account.risk))}>
                {account.risk} risk
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-500 mb-1">Recommended Action</div>
              <div className="text-sm text-gray-700">
                {account.risk === "critical"
                  ? "Schedule urgent call within 48 hours"
                  : "Send personalized check-in email"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 4: Automated Playbooks
function StepPlaybooks({ data }: { data: typeof INDUSTRY_DATA.saas }) {
  const playbooks = [
    {
      name: "At-Risk Recovery",
      trigger: "Score drops below 40",
      actions: ["Send check-in email to CSM", "Create urgent task", "Post to #cs-alerts Slack"],
      runs: 12,
    },
    {
      name: "Expansion Ready",
      trigger: "Score above 80 + usage growing",
      actions: ["Send upsell nudge email", "Notify account manager"],
      runs: 8,
    },
    {
      name: "Renewal Prep",
      trigger: "30 days before renewal",
      actions: ["Email CSM with renewal brief", "Create renewal task"],
      runs: 15,
    },
  ];

  return (
    <div className="space-y-4">
      {playbooks.map((pb) => (
        <div key={pb.name} className="border border-gray-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Zap className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{pb.name}</h4>
                <p className="text-xs text-gray-500">Trigger: {pb.trigger}</p>
              </div>
            </div>
            <span className="text-xs bg-green-100 text-green-800 border border-green-200 px-2 py-1 rounded-full font-medium">
              Active
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {pb.actions.map((action, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                  {action}
                </span>
                {idx < pb.actions.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">{pb.runs} runs this month</div>
        </div>
      ))}
    </div>
  );
}

// Step 5: Results / Before-After
function StepResults({ data }: { data: typeof INDUSTRY_DATA.saas }) {
  return (
    <div className="space-y-8">
      {/* Before / After comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-red-200 bg-red-50 rounded-xl p-6">
          <div className="text-sm font-medium text-red-600 mb-4">Before HealthScore</div>
          <div className="space-y-4">
            <div>
              <div className="text-3xl font-bold text-red-700">{data.churnBefore}%</div>
              <div className="text-sm text-red-600">Monthly churn rate</div>
            </div>
            <ul className="space-y-2 text-sm text-red-700">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                No visibility into customer health
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                Reactive — only knew about churn after it happened
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                Manual tracking in spreadsheets
              </li>
            </ul>
          </div>
        </div>

        <div className="border border-green-200 bg-green-50 rounded-xl p-6">
          <div className="text-sm font-medium text-green-600 mb-4">After HealthScore</div>
          <div className="space-y-4">
            <div>
              <div className="text-3xl font-bold text-green-700">{data.churnAfter}%</div>
              <div className="text-sm text-green-600">Monthly churn rate</div>
            </div>
            <ul className="space-y-2 text-sm text-green-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Real-time health scores for every customer
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                AI predictions catch at-risk accounts early
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Automated playbooks for instant action
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">
            {data.churnBefore - data.churnAfter}%
          </div>
          <div className="text-sm text-gray-500">Churn reduction</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">{data.mrrSaved}</div>
          <div className="text-sm text-gray-500">MRR saved</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">5 min</div>
          <div className="text-sm text-gray-500">Setup time</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">3 months</div>
          <div className="text-sm text-gray-500">Time to results</div>
        </div>
      </div>
    </div>
  );
}
