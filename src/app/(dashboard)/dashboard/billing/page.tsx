import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/stripe";
import { formatDate } from "@/lib/utils";
import { CheckCircle, Crown, Zap } from "lucide-react";
import { BillingClient } from "@/components/dashboard/billing/billing-client";

export const metadata = { title: "Billing" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, organization:hs_organizations(*)")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) redirect("/dashboard/onboarding");

  const org = Array.isArray(profile.organization) ? profile.organization[0] : profile.organization;
  const params = await searchParams;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing & Plan</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your subscription and billing details
        </p>
      </div>

      {params.success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <div className="font-medium text-green-900">Upgrade successful!</div>
            <div className="text-sm text-green-700">
              Your plan has been updated. All new features are now available.
            </div>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-500" />
          Current Plan
        </h2>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xl font-bold text-foreground capitalize">
              {(org as Record<string, unknown>)?.plan as string || "Free"} Plan
            </div>
            <div className="text-muted-foreground text-sm mt-1">
              {(org as Record<string, unknown>)?.plan === "free"
                ? "Free forever — no credit card required"
                : `Status: ${((org as Record<string, unknown>)?.plan_status as string) || "active"}`}
            </div>
            <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
              <span>
                <strong className="text-foreground">{(org as Record<string, unknown>)?.max_accounts as number}</strong> accounts
              </span>
              <span>
                <strong className="text-foreground">
                  {(org as Record<string, unknown>)?.max_integrations === -1
                    ? "Unlimited"
                    : (org as Record<string, unknown>)?.max_integrations as number}
                </strong>{" "}
                integrations
              </span>
            </div>
          </div>
          <BillingClient
            currentPlan={(org as Record<string, unknown>)?.plan as string}
            hasStripeCustomer={!!(org as Record<string, unknown>)?.stripe_customer_id}
          />
        </div>
      </div>

      {/* Plan Options */}
      <div>
        <h2 className="font-semibold text-foreground mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(PLANS).map(([key, plan]) => {
            const isCurrent = (org as Record<string, unknown>)?.plan === key;
            return (
              <div
                key={key}
                className={`bg-white rounded-xl border p-5 relative ${
                  isCurrent ? "border-blue-500 ring-1 ring-blue-500" : "border-border"
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Current
                  </div>
                )}
                {key === "growth" && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="font-bold text-lg text-foreground">{plan.name}</div>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {plan.price === 0 ? "Free" : `$${plan.price}`}
                  {plan.price > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  )}
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Zap className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {!isCurrent && plan.price > 0 && (
                  <BillingClient
                    currentPlan={(org as Record<string, unknown>)?.plan as string}
                    targetPlan={key}
                    hasStripeCustomer={!!(org as Record<string, unknown>)?.stripe_customer_id}
                    compact
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
