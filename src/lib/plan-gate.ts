// Plan Gate — Feature access control based on subscription plan
import { PLANS, type PlanKey } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export type Feature =
  | "ai_predictions"
  | "playbooks"
  | "integrations"
  | "accounts"
  | "users"
  | "custom_formulas"
  | "api_access"
  | "white_label"
  | "export";

interface PlanLimits {
  accounts: number; // -1 = unlimited
  users: number;
  integrations: number;
  playbooks: number; // -1 = unlimited
  ai_predictions: boolean;
  custom_formulas: boolean;
  api_access: boolean;
  white_label: boolean;
  export: boolean;
}

const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  free: {
    accounts: 100,
    users: 1,
    integrations: 1,
    playbooks: 0,
    ai_predictions: false,
    custom_formulas: false,
    api_access: false,
    white_label: false,
    export: false,
  },
  starter: {
    accounts: 500,
    users: 3,
    integrations: 2,
    playbooks: 5,
    ai_predictions: true,
    custom_formulas: false,
    api_access: false,
    white_label: false,
    export: true,
  },
  growth: {
    accounts: 2000,
    users: 10,
    integrations: -1,
    playbooks: -1,
    ai_predictions: true,
    custom_formulas: true,
    api_access: true,
    white_label: false,
    export: true,
  },
  scale: {
    accounts: -1,
    users: -1,
    integrations: -1,
    playbooks: -1,
    ai_predictions: true,
    custom_formulas: true,
    api_access: true,
    white_label: true,
    export: true,
  },
};

export interface PlanAccessResult {
  allowed: boolean;
  limit: number | boolean;
  usage?: number;
  plan: PlanKey;
  upgradeRequired?: PlanKey;
}

const isMock = process.env.NEXT_PUBLIC_MOCK_DATA === "true";

export function getPlanLimits(plan: PlanKey): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

export function checkFeatureAccess(
  plan: PlanKey,
  feature: Feature,
  currentUsage?: number
): PlanAccessResult {
  // In mock mode, always return Growth plan access
  const effectivePlan = isMock ? "growth" : plan;
  const limits = getPlanLimits(effectivePlan);

  const booleanFeatures: Feature[] = [
    "ai_predictions",
    "custom_formulas",
    "api_access",
    "white_label",
    "export",
  ];

  if (booleanFeatures.includes(feature)) {
    const allowed = limits[feature as keyof PlanLimits] as boolean;
    return {
      allowed,
      limit: allowed,
      plan: effectivePlan,
      upgradeRequired: allowed ? undefined : getUpgradePlan(effectivePlan, feature),
    };
  }

  // Numeric limits (accounts, users, integrations, playbooks)
  const limit = limits[feature as keyof PlanLimits] as number;
  const usage = currentUsage ?? 0;

  if (limit === -1) {
    return { allowed: true, limit: -1, usage, plan: effectivePlan };
  }

  if (limit === 0) {
    return {
      allowed: false,
      limit: 0,
      usage,
      plan: effectivePlan,
      upgradeRequired: getUpgradePlan(effectivePlan, feature),
    };
  }

  return {
    allowed: usage < limit,
    limit,
    usage,
    plan: effectivePlan,
    upgradeRequired: usage >= limit ? getUpgradePlan(effectivePlan, feature) : undefined,
  };
}

function getUpgradePlan(currentPlan: PlanKey, feature: Feature): PlanKey {
  const planOrder: PlanKey[] = ["free", "starter", "growth", "scale"];
  const currentIndex = planOrder.indexOf(currentPlan);

  for (let i = currentIndex + 1; i < planOrder.length; i++) {
    const plan = planOrder[i];
    const limits = PLAN_LIMITS[plan];

    const booleanFeatures: Feature[] = [
      "ai_predictions",
      "custom_formulas",
      "api_access",
      "white_label",
      "export",
    ];

    if (booleanFeatures.includes(feature)) {
      if (limits[feature as keyof PlanLimits] as boolean) return plan;
    } else {
      const limit = limits[feature as keyof PlanLimits] as number;
      if (limit === -1 || limit > 0) return plan;
    }
  }

  return "scale";
}

/**
 * Fetch the current plan for an organization from the database.
 * In mock mode, returns "growth" plan.
 */
export async function getCurrentPlan(orgId: string): Promise<PlanKey> {
  if (isMock) return "growth";

  try {
    const supabase = await createServiceClient();
    const { data: org } = await supabase
      .from("hs_organizations")
      .select("plan")
      .eq("id", orgId)
      .single();

    if (org?.plan && PLANS[org.plan as PlanKey]) {
      return org.plan as PlanKey;
    }
  } catch (err) {
    console.warn("getCurrentPlan: failed to fetch plan, defaulting to free", err);
  }

  return "free";
}

export function getPlanPrice(plan: PlanKey): number {
  return PLANS[plan].price;
}

export function formatLimit(limit: number): string {
  if (limit === -1) return "Unlimited";
  return limit.toLocaleString();
}
