import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    priceId: null,
    maxAccounts: 50,
    maxIntegrations: 1,
    features: [
      "1 integration",
      "50 accounts",
      "Basic health scores",
      "Manual alerts",
    ],
  },
  starter: {
    name: "Starter",
    price: 49,
    priceId: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    maxAccounts: 500,
    maxIntegrations: 3,
    features: [
      "3 integrations",
      "500 accounts",
      "AI churn predictions",
      "Slack alerts",
      "Automated playbooks",
    ],
  },
  growth: {
    name: "Growth",
    price: 99,
    priceId: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
    maxAccounts: 2000,
    maxIntegrations: -1, // unlimited
    features: [
      "Unlimited integrations",
      "2,000 accounts",
      "HubSpot sync",
      "Advanced playbooks",
      "Custom segments",
      "Priority support",
    ],
  },
  scale: {
    name: "Scale",
    price: 199,
    priceId: process.env.STRIPE_PRICE_SCALE_MONTHLY,
    maxAccounts: -1, // unlimited
    maxIntegrations: -1, // unlimited
    features: [
      "Unlimited accounts",
      "API access",
      "Custom branding",
      "Dedicated CSM",
      "SLA guarantee",
      "SSO/SAML",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export async function createCheckoutSession({
  priceId,
  customerId,
  organizationId,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  customerId?: string;
  organizationId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { organization_id: organizationId },
    subscription_data: {
      metadata: { organization_id: organizationId },
    },
    allow_promotion_codes: true,
  });
}

export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export function getPlanFromPriceId(priceId: string): PlanKey {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) return key as PlanKey;
  }
  return "free";
}
