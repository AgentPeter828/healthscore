import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";
import { PricingDisclosure } from "@/components/marketing/pricing-disclosure";

export const metadata: Metadata = {
  title: "HealthScore vs ChurnZero — Affordable Alternative",
  description: "Compare HealthScore vs ChurnZero for customer health scoring. Self-serve at $49/mo vs enterprise Contact Sales pricing. Free plan available.",
};

type CellValue = boolean | string;

const comparisonRows: { feature: string; healthscore: CellValue; churnzero: CellValue }[] = [
  { feature: "Starting price", healthscore: "$49/mo (Starter)", churnzero: "Contact Sales" },
  { feature: "Free plan available", healthscore: true, churnzero: false },
  { feature: "Self-serve signup", healthscore: true, churnzero: false },
  { feature: "Setup time", healthscore: "< 5 minutes", churnzero: "Weeks (onboarding)" },
  { feature: "Real-time health scores", healthscore: true, churnzero: true },
  { feature: "Custom score formulas", healthscore: true, churnzero: true },
  { feature: "Churn prediction", healthscore: true, churnzero: true },
  { feature: "Slack alerts", healthscore: true, churnzero: true },
  { feature: "Automated playbooks (ChurnPlays)", healthscore: true, churnzero: true },
  { feature: "In-app walkthroughs / NPS surveys", healthscore: false, churnzero: true },
  { feature: "Stripe integration", healthscore: true, churnzero: true },
  { feature: "Mixpanel / Amplitude", healthscore: true, churnzero: "Enterprise only" },
  { feature: "REST API", healthscore: true, churnzero: true },
  { feature: "30-day money-back guarantee", healthscore: true, churnzero: false },
  { feature: "No long-term contract", healthscore: true, churnzero: false },
];

const differentiators = [
  {
    title: "Transparent pricing",
    hs: "Public pricing starting at $49/mo. No sales call required.",
    churnzero:
      "Enterprise pricing model. Typically requires a demo and custom quote. Budget often starts at $10k+/yr.",
  },
  {
    title: "Ease of setup",
    hs: "Connect your first integration and see health scores in under 5 minutes. No implementation team needed.",
    churnzero:
      "ChurnZero typically requires a dedicated implementation process lasting several weeks with an assigned CSM.",
  },
  {
    title: "Right tool for the job",
    hs: "Focused on health scoring, churn prediction, and alerts. Does one thing exceptionally well.",
    churnzero:
      "Comprehensive platform with in-app walkthroughs, NPS, and advanced journey orchestration — powerful but complex.",
  },
  {
    title: "Free tier",
    hs: "Free plan for up to 25 accounts — no credit card, no time limit.",
    churnzero: "No free tier available.",
  },
];

export default function AlternativeToChurnZeroPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm text-blue-700 mb-6">
              Comparison
            </div>
            <h1 className="text-4xl font-extrabold sm:text-5xl leading-tight text-gray-900">
              HealthScore vs ChurnZero
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              ChurnZero is powerful — but complex and expensive. HealthScore gives you the health scoring and churn prediction you actually need, at a price you can justify, without a 6-week implementation.
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
                className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
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
            competitorName="ChurnZero"
            sourceUrl="https://churnzero.com/pricing"
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
              <p className="text-sm text-gray-500 mt-1">Self-serve. No sales call.</p>
              <Link
                href="/signup"
                className="mt-6 block rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Start for free
              </Link>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <span className="text-xl font-bold text-gray-700">ChurnZero</span>
              <p className="text-4xl font-extrabold text-gray-900 mt-2">Custom</p>
              <p className="text-gray-500 mt-1">Contact sales for pricing</p>
              <p className="text-sm text-gray-400 font-medium mt-3">
                No free plan
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Multi-week onboarding required
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
            Why teams choose HealthScore over ChurnZero
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
                      ChurnZero
                    </span>
                    <p className="text-sm text-gray-600">{d.churnzero}</p>
                  </div>
                </div>
              </div>
            ))}
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
                  <th className="py-4 px-6 text-center font-semibold text-gray-700 w-1/4">ChurnZero</th>
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
                      {typeof row.churnzero === "boolean" ? (
                        row.churnzero ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-600">{row.churnzero}</span>
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
            Ready to try a simpler approach?
          </h2>
          <p className="mt-4 text-xl text-blue-100">
            Get up and running in 5 minutes. No demo. No sales call. No contract.
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
