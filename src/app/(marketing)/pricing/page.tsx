"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { PricingComparisonChart } from "@/components/marketing/pricing-comparison-chart";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    monthlyPrice: 0,
    description: "Perfect for early-stage teams",
    href: "/signup",
    cta: "Get started free",
    highlighted: false,
  },
  {
    name: "Starter",
    monthlyPrice: 49,
    description: "For growing CS teams",
    href: "/signup?plan=starter",
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Growth",
    monthlyPrice: 99,
    description: "For scaling businesses",
    href: "/signup?plan=growth",
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Scale",
    monthlyPrice: 199,
    description: "For enterprise CS orgs",
    href: "/signup?plan=scale",
    cta: "Start free trial",
    highlighted: false,
  },
];

type FeatureValue = boolean | string;

const comparisonFeatures: { category: string; features: { name: string; values: FeatureValue[] }[] }[] = [
  {
    category: "Accounts",
    features: [
      { name: "Active accounts", values: ["25", "200", "1,000", "Unlimited"] },
      { name: "CSM seats", values: ["1", "3", "10", "Unlimited"] },
    ],
  },
  {
    category: "Health Scores",
    features: [
      { name: "Real-time health scores", values: [true, true, true, true] },
      { name: "Custom score formulas", values: [false, true, true, true] },
      { name: "Score history & trends", values: [false, true, true, true] },
      { name: "Churn risk prediction", values: [false, false, true, true] },
    ],
  },
  {
    category: "Integrations",
    features: [
      { name: "Number of integrations", values: ["3", "10", "Unlimited", "Unlimited"] },
      { name: "Stripe", values: [true, true, true, true] },
      { name: "Intercom / Zendesk", values: [false, true, true, true] },
      { name: "Segment / Mixpanel / Amplitude", values: [false, false, true, true] },
      { name: "Custom webhooks", values: [false, false, true, true] },
      { name: "REST API access", values: [false, false, true, true] },
    ],
  },
  {
    category: "Alerts & Playbooks",
    features: [
      { name: "Email alerts", values: [true, true, true, true] },
      { name: "Slack alerts", values: [false, true, true, true] },
      { name: "Automated playbooks", values: [false, false, true, true] },
      { name: "Webhook notifications", values: [false, false, true, true] },
    ],
  },
  {
    category: "Reporting",
    features: [
      { name: "Dashboard analytics", values: [true, true, true, true] },
      { name: "CSV export", values: [false, true, true, true] },
      { name: "Custom reports", values: [false, false, true, true] },
      { name: "Executive summary emails", values: [false, false, true, true] },
    ],
  },
  {
    category: "Support",
    features: [
      { name: "Community support", values: [true, true, true, true] },
      { name: "Email support", values: [false, true, true, true] },
      { name: "Priority support", values: [false, false, true, true] },
      { name: "Dedicated CSM", values: [false, false, false, true] },
      { name: "SLA guarantee", values: [false, false, false, true] },
    ],
  },
];

const faqs = [
  {
    q: "Is there a free trial?",
    a: "Yes! All paid plans come with a 14-day free trial. No credit card required to start. You can also use the Free plan indefinitely.",
  },
  {
    q: "Do I need a credit card to sign up?",
    a: "No. You can sign up for the Free plan or start a trial of any paid plan without a credit card. We'll only ask for payment details when you're ready to upgrade.",
  },
  {
    q: "Can I cancel at any time?",
    a: "Absolutely. You can cancel your subscription at any time from your account settings. There are no cancellation fees or lock-in contracts.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. Starter and above plans include full CSV export of all your account data and health scores. We also support data export via API on Growth and Scale plans.",
  },
  {
    q: "Which integrations are included?",
    a: "All plans include Stripe. Starter plans add Intercom, Zendesk, HelpScout, and 7 more. Growth and Scale plans include all available integrations with no limits.",
  },
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately, with prorated billing. Downgrades take effect at the end of your current billing period.",
  },
  {
    q: "Do you offer enterprise or custom pricing?",
    a: "Yes. If your team has more than 5,000 accounts or has specific compliance or security requirements, contact us at hello@healthscore.app to discuss a custom plan.",
  },
  {
    q: "Is annual billing available?",
    a: "Annual billing with 20% savings is coming soon! Join the waitlist to be notified when it launches. Currently all plans are billed monthly.",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl text-gray-900">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Start free. No credit card required. Scale when you&apos;re ready.
          </p>

          {/* Billing toggle */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <span
              className={cn(
                "text-sm font-medium",
                !annual ? "text-gray-900" : "text-gray-400"
              )}
            >
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={cn(
                "relative inline-flex h-6 w-12 items-center rounded-full transition-colors",
                annual ? "bg-blue-500" : "bg-gray-300"
              )}
              aria-label="Toggle annual billing"
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm",
                  annual ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
            <span
              className={cn(
                "text-sm font-medium",
                annual ? "text-gray-900" : "text-gray-400"
              )}
            >
              Annual
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Coming soon
              </span>
            </span>
          </div>
          {annual && (
            <p className="mt-3 text-sm text-amber-600">
              Annual billing (20% savings) is coming soon. Monthly pricing shown.
            </p>
          )}
        </div>
      </section>

      {/* Pricing cards */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const displayPrice = annual
                ? Math.round(plan.monthlyPrice * 0.8)
                : plan.monthlyPrice;
              return (
                <div
                  key={plan.name}
                  className={cn(
                    "rounded-2xl p-8 flex flex-col",
                    plan.highlighted
                      ? "bg-blue-600 text-white shadow-xl ring-4 ring-blue-200"
                      : "bg-white border border-gray-200 shadow-sm"
                  )}
                >
                  <h3
                    className={cn(
                      "text-lg font-bold",
                      plan.highlighted ? "text-white" : "text-gray-900"
                    )}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={cn(
                      "text-sm mt-1",
                      plan.highlighted ? "text-blue-100" : "text-gray-500"
                    )}
                  >
                    {plan.description}
                  </p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span
                      className={cn(
                        "text-4xl font-extrabold",
                        plan.highlighted ? "text-white" : "text-gray-900"
                      )}
                    >
                      ${displayPrice}
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        plan.highlighted ? "text-blue-100" : "text-gray-500"
                      )}
                    >
                      {" "}USD/mo
                    </span>
                  </div>
                  {annual && plan.monthlyPrice > 0 && (
                    <p
                      className={cn(
                        "text-xs mt-1",
                        plan.highlighted ? "text-blue-200" : "text-gray-400"
                      )}
                    >
                      Billed annually (coming soon)
                    </p>
                  )}
                  <div className="flex-1" />
                  <Link
                    href={plan.href}
                    className={cn(
                      "mt-8 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors",
                      plan.highlighted
                        ? "bg-white text-blue-600 hover:bg-blue-50"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Compare all features
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="py-4 px-6 text-left text-gray-500 font-medium w-1/3">
                    Feature
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.name}
                      className={cn(
                        "py-4 px-4 text-center font-semibold",
                        plan.highlighted ? "text-blue-600" : "text-gray-900"
                      )}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((category, ci) => (
                  <>
                    <tr key={`cat-${ci}`} className="bg-gray-50 border-t border-b border-gray-200">
                      <td
                        colSpan={5}
                        className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-gray-500"
                      >
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, fi) => (
                      <tr
                        key={`feat-${ci}-${fi}`}
                        className={cn(
                          "border-t border-gray-100",
                          fi % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        )}
                      >
                        <td className="py-3 px-6 text-gray-700">{feature.name}</td>
                        {feature.values.map((val, vi) => (
                          <td key={vi} className="py-3 px-4 text-center">
                            {typeof val === "boolean" ? (
                              val ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                              )
                            ) : (
                              <span className="text-gray-700 font-medium">{val}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Chart */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PricingComparisonChart />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-xl border border-gray-200 bg-white p-6"
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{faq.q}</h3>
                    <p className="mt-2 text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold">Ready to get started?</h2>
          <p className="mt-4 text-xl text-blue-100">
            Start reducing churn today — set up in minutes, not weeks.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Start for free — no credit card required
          </Link>
        </div>
      </section>
    </>
  );
}
