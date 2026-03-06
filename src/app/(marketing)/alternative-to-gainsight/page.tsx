import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";
import { PricingDisclosure } from "@/components/marketing/pricing-disclosure";

export const metadata: Metadata = {
  title: "HealthScore vs Gainsight — Affordable Alternative",
  description: "Compare HealthScore vs Gainsight for customer health scoring. Start at $49/mo with self-serve signup vs enterprise-only Contact Sales. Free plan available.",
};

type CellValue = boolean | string;

const comparisonRows: { feature: string; healthscore: CellValue; gainsight: CellValue }[] = [
  { feature: "Starting price", healthscore: "$49/mo (Starter)", gainsight: "Contact Sales" },
  { feature: "Free plan available", healthscore: true, gainsight: false },
  { feature: "Self-serve signup", healthscore: true, gainsight: false },
  { feature: "Setup time", healthscore: "< 5 minutes", gainsight: "Months (implementation)" },
  { feature: "Real-time health scores", healthscore: true, gainsight: true },
  { feature: "Custom score formulas", healthscore: true, gainsight: true },
  { feature: "Churn prediction", healthscore: true, gainsight: true },
  { feature: "Slack alerts", healthscore: true, gainsight: true },
  { feature: "Automated playbooks", healthscore: true, gainsight: true },
  { feature: "360° customer view / timeline", healthscore: false, gainsight: true },
  { feature: "Revenue optimisation (Gainsight RO)", healthscore: false, gainsight: true },
  { feature: "In-app PX / product analytics", healthscore: false, gainsight: "Add-on (PX)" },
  { feature: "Stripe integration", healthscore: true, gainsight: true },
  { feature: "REST API", healthscore: true, gainsight: true },
  { feature: "30-day money-back guarantee", healthscore: true, gainsight: false },
  { feature: "No professional services required", healthscore: true, gainsight: false },
  { feature: "No long-term contract", healthscore: true, gainsight: false },
];

const differentiators = [
  {
    title: "Price and accessibility",
    hs: "Starts at $49/mo with a free plan. Sign up in seconds without talking to anyone.",
    gainsight:
      "Gainsight is an enterprise platform with custom pricing typically starting in the tens of thousands per year. A dedicated implementation team is standard.",
  },
  {
    title: "Time to value",
    hs: "Connect your first integration and see health scores in under 5 minutes. No professional services engagement needed.",
    gainsight:
      "Gainsight implementations are famously complex. Most customers budget 3–6 months for a full implementation before going live.",
  },
  {
    title: "Focus and simplicity",
    hs: "Built to do one job exceptionally well: health scoring and churn prevention. Clean, fast, opinionated.",
    gainsight:
      "Gainsight is a full customer success platform with CS, PX, and Revenue Optimisation modules. Powerful — but requires significant admin overhead.",
  },
  {
    title: "Suitable company size",
    hs: "Perfect for startups through to mid-market SaaS companies (1–5,000 accounts).",
    gainsight:
      "Designed for large enterprise CS organisations with dedicated CS ops teams and significant budgets.",
  },
];

export default function AlternativeToGainsightPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-blue-950 text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300 mb-6">
              Comparison
            </div>
            <h1 className="text-4xl font-extrabold sm:text-5xl leading-tight">
              HealthScore vs Gainsight
            </h1>
            <p className="mt-6 text-xl text-slate-300">
              Gainsight is the industry standard for enterprise CS teams — but it&apos;s complex, expensive, and takes months to implement. HealthScore gives you 80% of the value in 5 minutes at a fraction of the cost.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                Try HealthScore free
              </Link>
              <Link
                href="/pricing"
                className="rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold text-white hover:bg-white/20 transition-colors"
              >
                See our pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing disclosure */}
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PricingDisclosure
            competitorName="Gainsight"
            sourceUrl="https://www.gainsight.com/pricing"
            dateVerified="March 2026"
          />
        </div>
      </section>

      {/* Quick price comparison */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            At a glance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="rounded-2xl border-2 border-blue-500 bg-white p-8 text-center shadow-sm">
              <span className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-xl font-bold mb-2">
                HealthScore
              </span>
              <p className="text-4xl font-extrabold text-gray-900 mt-2">$49</p>
              <p className="text-gray-500 mt-1">/mo (Starter plan)</p>
              <p className="text-sm text-green-600 font-semibold mt-3">
                Free plan available
              </p>
              <p className="text-sm text-gray-500 mt-1">Self-serve. No sales call. No PS.</p>
              <Link
                href="/signup"
                className="mt-6 block rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Start for free
              </Link>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <span className="text-xl font-bold text-gray-700">Gainsight</span>
              <p className="text-4xl font-extrabold text-gray-900 mt-2">Custom</p>
              <p className="text-gray-500 mt-1">Contact sales for pricing</p>
              <p className="text-sm text-gray-400 font-medium mt-3">
                No free plan
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Months-long implementation typical
              </p>
              <div className="mt-6 block rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-500">
                Contact sales
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key differentiators */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            HealthScore vs Gainsight: the honest comparison
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {differentiators.map((d) => (
              <div
                key={d.title}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <h3 className="font-semibold text-gray-900 mb-4">{d.title}</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
                    <span className="text-xs font-bold uppercase text-blue-600 mt-0.5 shrink-0 w-20">
                      HealthScore
                    </span>
                    <p className="text-sm text-gray-700">{d.hs}</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <span className="text-xs font-bold uppercase text-gray-500 mt-0.5 shrink-0 w-20">
                      Gainsight
                    </span>
                    <p className="text-sm text-gray-600">{d.gainsight}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* When to use which */}
      <section className="py-16 bg-blue-50 border-y border-blue-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">
            Which tool is right for you?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-white border border-blue-200 p-6">
              <h3 className="font-bold text-blue-700 mb-3">Choose HealthScore if...</h3>
              <ul className="space-y-2">
                {[
                  "You want to be live in under an hour",
                  "You have 1–5,000 accounts",
                  "You want predictable, transparent pricing",
                  "You don't have a CS Ops team",
                  "Health scoring is your primary need",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-6">
              <h3 className="font-bold text-gray-700 mb-3">Consider Gainsight if...</h3>
              <ul className="space-y-2">
                {[
                  "You have 5,000+ enterprise accounts",
                  "You need full CS platform + PX + revenue ops",
                  "You have a dedicated CS Ops team",
                  "You can invest 3–6 months in implementation",
                  "Budget is not a constraint",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Full feature comparison
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-4 px-6 text-left text-gray-500 font-medium w-1/2">Feature</th>
                  <th className="py-4 px-6 text-center font-bold text-blue-600 w-1/4">HealthScore</th>
                  <th className="py-4 px-6 text-center font-semibold text-gray-700 w-1/4">Gainsight</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="py-3 px-6 text-gray-700">{row.feature}</td>
                    <td className="py-3 px-6 text-center">
                      {typeof row.healthscore === "boolean" ? (
                        row.healthscore ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="font-semibold text-gray-800">{row.healthscore}</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-center">
                      {typeof row.gainsight === "boolean" ? (
                        row.gainsight ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-600">{row.gainsight}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold">
            Get the clarity of Gainsight without the complexity
          </h2>
          <p className="mt-4 text-xl text-blue-100">
            Start free. Set up in 5 minutes. Scale to thousands of accounts.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-white px-8 py-3 text-base font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Start for free — no credit card required
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
