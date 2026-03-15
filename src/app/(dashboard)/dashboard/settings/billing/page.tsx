"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UsageBanner } from "@/components/dashboard/usage-banner";
import { cn } from "@/lib/utils";
import {
  Crown,
  Zap,
  Loader2,
  CreditCard,
  Check,
  AlertTriangle,
  FileText,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

interface PlanConfig {
  key: string;
  name: string;
  price: number;
  features: string[];
  limits: { accounts: number; integrations: number; users: number };
  highlighted?: boolean;
}

const PLANS: PlanConfig[] = [
  {
    key: "free",
    name: "Free",
    price: 0,
    features: [
      "100 accounts",
      "1 integration",
      "Basic health scores",
      "Manual alerts",
    ],
    limits: { accounts: 100, integrations: 1, users: 1 },
  },
  {
    key: "starter",
    name: "Starter",
    price: 49,
    features: [
      "500 accounts",
      "2 integrations",
      "AI churn predictions",
      "Basic playbooks",
      "CSV export",
    ],
    limits: { accounts: 500, integrations: 2, users: 3 },
  },
  {
    key: "growth",
    name: "Growth",
    price: 99,
    features: [
      "2,000 accounts",
      "Unlimited integrations",
      "Advanced playbooks",
      "Custom formulas",
      "API access",
    ],
    limits: { accounts: 2000, integrations: -1, users: 10 },
    highlighted: true,
  },
  {
    key: "scale",
    name: "Scale",
    price: 199,
    features: [
      "Unlimited accounts",
      "Unlimited everything",
      "White-label",
      "Dedicated CSM",
      "SLA guarantee",
    ],
    limits: { accounts: -1, integrations: -1, users: -1 },
  },
];

interface BillingData {
  plan: string;
  plan_status: string;
  accounts_used: number;
  integrations_used: number;
  users_used: number;
  stripe_customer_id: string | null;
  subscription: {
    status: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
  } | null;
  invoices: {
    id: string;
    date: string;
    amount: string;
    status: string;
  }[];
}

const MOCK_BILLING: BillingData = {
  plan: "growth",
  plan_status: "active",
  accounts_used: 12,
  integrations_used: 2,
  users_used: 1,
  stripe_customer_id: "cus_mock_123",
  subscription: {
    status: "active",
    current_period_end: new Date(Date.now() + 15 * 86400000).toISOString(),
    cancel_at_period_end: false,
  },
  invoices: [
    { id: "inv_001", date: new Date(Date.now() - 15 * 86400000).toISOString(), amount: "$99.00 USD", status: "paid" },
    { id: "inv_002", date: new Date(Date.now() - 45 * 86400000).toISOString(), amount: "$99.00 USD", status: "paid" },
    { id: "inv_003", date: new Date(Date.now() - 75 * 86400000).toISOString(), amount: "$49.00 USD", status: "paid" },
  ],
};

export default function BillingSettingsPage() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isMock = typeof window !== "undefined" && process.env.NEXT_PUBLIC_MOCK_DATA === "true";

  useEffect(() => {
    if (isMock) {
      setBillingData(MOCK_BILLING);
      setLoading(false);
      return;
    }

    fetch("/api/settings/billing")
      .then((r) => r.json())
      .then((data) => {
        setBillingData(data);
        setLoading(false);
      })
      .catch(() => {
        setBillingData(MOCK_BILLING);
        setLoading(false);
      });
  }, [isMock]);

  async function handleChangePlan(planKey: string) {
    setActionLoading(planKey);
    try {
      if (isMock) {
        setBillingData((prev) => prev ? { ...prev, plan: planKey } : prev);
        setActionLoading(null);
        return;
      }

      // If upgrading from free (no subscription yet), go to checkout
      if (billingData?.plan === "free" && planKey !== "free") {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: planKey }),
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        return;
      }

      const res = await fetch("/api/billing/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPlanId: planKey }),
      });
      const data = await res.json();
      if (data.success) {
        setBillingData((prev) => prev ? { ...prev, plan: planKey } : prev);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleManageBilling() {
    setActionLoading("portal");
    try {
      if (isMock) {
        setActionLoading(null);
        return;
      }
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelSubscription() {
    setActionLoading("cancel");
    try {
      if (isMock) {
        setBillingData((prev) => prev ? { ...prev, plan: "free" } : prev);
        setShowCancelConfirm(false);
        setActionLoading(null);
        return;
      }
      await handleChangePlan("free");
      setShowCancelConfirm(false);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!billingData) return null;

  const currentPlan = PLANS.find((p) => p.key === billingData.plan) || PLANS[0];
  const planIndex = PLANS.findIndex((p) => p.key === billingData.plan);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing & Plan</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your subscription, usage, and billing details
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-500" />
          Current Plan
        </h2>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-2xl font-bold text-foreground capitalize">
              {currentPlan.name} Plan
            </div>
            <div className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
              {currentPlan.price === 0 ? (
                "Free forever — no credit card required"
              ) : (
                <>
                  <span className="font-semibold text-foreground">${currentPlan.price} USD</span>/mo
                  <Badge variant="outline" className="capitalize bg-green-100 text-green-700 border-green-200">
                    {billingData.plan_status}
                  </Badge>
                </>
              )}
            </div>
            {billingData.subscription?.current_period_end && currentPlan.price > 0 && (
              <div className="text-xs text-muted-foreground mt-2">
                {billingData.subscription.cancel_at_period_end
                  ? `Cancels on ${new Date(billingData.subscription.current_period_end).toLocaleDateString()}`
                  : `Renews on ${new Date(billingData.subscription.current_period_end).toLocaleDateString()}`}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {billingData.stripe_customer_id && currentPlan.price > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageBilling}
                disabled={actionLoading === "portal"}
                className="cursor-pointer gap-1.5"
              >
                {actionLoading === "portal" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
                Payment Method
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Usage stats */}
      <div className="space-y-3">
        <h2 className="font-semibold text-foreground">Usage</h2>
        <UsageBanner label="Accounts" current={billingData.accounts_used} limit={currentPlan.limits.accounts} />
        <UsageBanner label="Integrations" current={billingData.integrations_used} limit={currentPlan.limits.integrations} />
        <UsageBanner label="Team Members" current={billingData.users_used} limit={currentPlan.limits.users} />
      </div>

      {/* Plan comparison */}
      <div>
        <h2 className="font-semibold text-foreground mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan, idx) => {
            const isCurrent = plan.key === billingData.plan;
            const isUpgrade = idx > planIndex;
            const isDowngrade = idx < planIndex;

            return (
              <div
                key={plan.key}
                className={cn(
                  "bg-white rounded-xl border p-5 relative flex flex-col",
                  isCurrent ? "border-blue-500 ring-1 ring-blue-500" : "border-border",
                  plan.highlighted && !isCurrent && "border-blue-300"
                )}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Current
                  </div>
                )}
                {plan.highlighted && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="font-bold text-lg text-foreground">{plan.name}</div>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {plan.price === 0 ? "Free" : `$${plan.price}`}
                  {plan.price > 0 && (
                    <span className="text-sm font-normal text-muted-foreground"> USD/mo</span>
                  )}
                </div>
                <ul className="mt-4 space-y-2 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {!isCurrent && (
                  <Button
                    size="sm"
                    variant={isUpgrade ? "default" : "outline"}
                    className={cn("mt-4 w-full cursor-pointer", isUpgrade && "bg-blue-600 hover:bg-blue-500 text-white")}
                    onClick={() => handleChangePlan(plan.key)}
                    disabled={actionLoading === plan.key}
                  >
                    {actionLoading === plan.key ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : isUpgrade ? (
                      <>
                        Upgrade <ArrowRight className="w-3 h-3 ml-1" />
                      </>
                    ) : (
                      "Downgrade"
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          All prices in USD. Upgrades are prorated. Downgrades take effect at the end of the current billing period.
        </p>
      </div>

      {/* Billing History */}
      {billingData.invoices.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Billing History
          </h2>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {billingData.invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4 text-foreground">
                      {new Date(inv.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium tabular-nums">{inv.amount}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="capitalize bg-green-100 text-green-700 border-green-200">
                        {inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancel subscription */}
      {currentPlan.price > 0 && (
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Cancel Subscription
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Downgrade to the Free plan. You&apos;ll lose access to paid features at the end of your billing period.
          </p>
          {!showCancelConfirm ? (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setShowCancelConfirm(true)}
            >
              Cancel Subscription
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="destructive"
                size="sm"
                className="cursor-pointer"
                onClick={handleCancelSubscription}
                disabled={actionLoading === "cancel"}
              >
                {actionLoading === "cancel" ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Yes, cancel my subscription
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep my plan
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
