// HealthScore Scoring Engine
// Converts raw metrics from webhook events into normalized 0-100 scores

import { FormulaComponent } from "./types";

export interface RawMetrics {
  // Usage (from Segment/Mixpanel/Amplitude)
  events_last_30d?: number;
  events_prev_30d?: number;
  active_users_last_30d?: number;
  total_users?: number;
  sessions_last_7d?: number;

  // Support (from Intercom/HelpScout/Zendesk)
  open_tickets?: number;
  tickets_last_30d?: number;
  avg_resolution_days?: number;
  csat_score?: number; // 0-10

  // Billing (from Stripe)
  payment_failures_last_90d?: number;
  last_payment_status?: "succeeded" | "failed" | "past_due";
  plan_downgrades_last_90d?: number;
  mrr_change_percent?: number;

  // Engagement
  days_since_last_login?: number;
  admin_last_login_days?: number;
  dau_mau_ratio?: number; // 0-1

  // NPS
  nps_score?: number; // -100 to 100 raw NPS, we normalize to 0-100
  last_nps_response_days?: number;

  // Feature Adoption
  features_used?: number;
  total_features_available?: number;
  key_features_adopted?: boolean[];
}

// Normalize a value to 0-100 using a sigmoid-like curve
function normalize(
  value: number,
  goodValue: number,
  badValue: number
): number {
  if (goodValue === badValue) return 50;
  const range = Math.abs(goodValue - badValue);
  const progress =
    goodValue > badValue
      ? (value - badValue) / range
      : (goodValue - value) / range;
  return Math.round(Math.max(0, Math.min(100, progress * 100)));
}

export function calculateUsageScore(metrics: RawMetrics): number {
  const scores: number[] = [];

  // Event volume trend
  if (
    metrics.events_last_30d !== undefined &&
    metrics.events_prev_30d !== undefined &&
    metrics.events_prev_30d > 0
  ) {
    const trend = metrics.events_last_30d / metrics.events_prev_30d;
    scores.push(normalize(trend, 1.5, 0.3)); // 1.5x growth = 100, 0.3x = 0
  }

  // Active users ratio
  if (
    metrics.active_users_last_30d !== undefined &&
    metrics.total_users !== undefined &&
    metrics.total_users > 0
  ) {
    const ratio = metrics.active_users_last_30d / metrics.total_users;
    scores.push(normalize(ratio, 0.8, 0.1)); // 80% active = 100, 10% = 0
  }

  // Recent sessions
  if (metrics.sessions_last_7d !== undefined) {
    scores.push(normalize(metrics.sessions_last_7d, 20, 0));
  }

  if (scores.length === 0) return 50; // No data = neutral
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function calculateSupportScore(metrics: RawMetrics): number {
  const scores: number[] = [];

  // Open tickets (more = worse)
  if (metrics.open_tickets !== undefined) {
    scores.push(normalize(metrics.open_tickets, 0, 10)); // 0 tickets = 100, 10+ = 0
  }

  // Ticket volume trend
  if (metrics.tickets_last_30d !== undefined) {
    scores.push(normalize(metrics.tickets_last_30d, 0, 20)); // inverse: 0 tickets = 100
  }

  // Resolution time
  if (metrics.avg_resolution_days !== undefined) {
    scores.push(normalize(metrics.avg_resolution_days, 0.5, 7)); // <12h = 100, 7+ days = 0
  }

  // CSAT score
  if (metrics.csat_score !== undefined) {
    scores.push(normalize(metrics.csat_score, 9, 5)); // 9/10 = 100, 5/10 = 0
  }

  if (scores.length === 0) return 75; // No support data = assume healthy
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function calculateBillingScore(metrics: RawMetrics): number {
  const scores: number[] = [];

  // Payment failures
  if (metrics.payment_failures_last_90d !== undefined) {
    scores.push(normalize(metrics.payment_failures_last_90d, 0, 3)); // 0 failures = 100, 3+ = 0
  }

  // Current payment status
  if (metrics.last_payment_status) {
    if (metrics.last_payment_status === "succeeded") scores.push(100);
    else if (metrics.last_payment_status === "failed") scores.push(0);
    else if (metrics.last_payment_status === "past_due") scores.push(20);
  }

  // Plan downgrades
  if (metrics.plan_downgrades_last_90d !== undefined) {
    scores.push(normalize(metrics.plan_downgrades_last_90d, 0, 2));
  }

  // MRR trend
  if (metrics.mrr_change_percent !== undefined) {
    scores.push(normalize(metrics.mrr_change_percent, 10, -30)); // +10% = 100, -30% = 0
  }

  if (scores.length === 0) return 80; // No billing data = assume OK
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function calculateEngagementScore(metrics: RawMetrics): number {
  const scores: number[] = [];

  // Days since last login
  if (metrics.days_since_last_login !== undefined) {
    scores.push(normalize(metrics.days_since_last_login, 0, 30)); // Today = 100, 30+ days = 0
  }

  // Admin activity
  if (metrics.admin_last_login_days !== undefined) {
    scores.push(normalize(metrics.admin_last_login_days, 0, 14)); // Today = 100, 14+ days = 0
  }

  // DAU/MAU ratio
  if (metrics.dau_mau_ratio !== undefined) {
    scores.push(normalize(metrics.dau_mau_ratio, 0.4, 0.02)); // 40% DAU/MAU = 100
  }

  if (scores.length === 0) return 50;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function calculateNPSScore(metrics: RawMetrics): number {
  if (metrics.nps_score === undefined) return 50; // No NPS data = neutral

  // NPS ranges from -100 to 100, normalize to 0-100
  const normalized = (metrics.nps_score + 100) / 2;

  // Penalize stale NPS data
  if (metrics.last_nps_response_days !== undefined) {
    const staleness = Math.max(0, 1 - metrics.last_nps_response_days / 365);
    return Math.round(normalized * (0.5 + staleness * 0.5));
  }

  return Math.round(normalized);
}

export function calculateFeatureAdoptionScore(metrics: RawMetrics): number {
  if (
    metrics.features_used !== undefined &&
    metrics.total_features_available !== undefined &&
    metrics.total_features_available > 0
  ) {
    return Math.round(
      (metrics.features_used / metrics.total_features_available) * 100
    );
  }

  if (metrics.key_features_adopted) {
    const adopted = metrics.key_features_adopted.filter(Boolean).length;
    return Math.round((adopted / metrics.key_features_adopted.length) * 100);
  }

  return 50;
}

export function calculateAllScores(metrics: RawMetrics) {
  return {
    usage_score: calculateUsageScore(metrics),
    support_score: calculateSupportScore(metrics),
    billing_score: calculateBillingScore(metrics),
    engagement_score: calculateEngagementScore(metrics),
    nps_score: calculateNPSScore(metrics),
    feature_adoption_score: calculateFeatureAdoptionScore(metrics),
  };
}

export function calculateOverallScore(
  componentScores: ReturnType<typeof calculateAllScores>,
  formula: FormulaComponent[]
): number {
  const enabledComponents = formula.filter((c) => c.enabled);
  if (enabledComponents.length === 0) return 50;

  const totalWeight = enabledComponents.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 50;

  let weightedSum = 0;
  for (const component of enabledComponents) {
    const score =
      componentScores[component.key as keyof typeof componentScores] ?? 50;
    weightedSum += score * (component.weight / totalWeight);
  }

  return Math.round(Math.max(0, Math.min(100, weightedSum)));
}

// AI-assisted churn risk calculation
// Weights recent trends more heavily than historical data
export function predictChurnRisk(
  currentScore: number,
  scoreHistory: number[], // Recent to oldest
  metrics: RawMetrics
): { risk: number; label: string; factors: string[] } {
  const factors: string[] = [];
  let risk = 0;

  // Base risk from current score (inverted)
  const scoreRisk = (100 - currentScore) / 100;
  risk += scoreRisk * 0.35;

  // Trend analysis (weight recent more than historical)
  if (scoreHistory.length >= 2) {
    const recentScore = scoreHistory[0];
    const olderScore = scoreHistory[Math.min(3, scoreHistory.length - 1)];
    const trend = recentScore - olderScore;

    if (trend < -20) {
      risk += 0.25;
      factors.push("Significant score decline in last 30 days");
    } else if (trend < -10) {
      risk += 0.15;
      factors.push("Moderate score decline recently");
    } else if (trend < 0) {
      risk += 0.05;
    }
  }

  // Billing signals
  if (metrics.last_payment_status === "failed") {
    risk += 0.2;
    factors.push("Recent payment failure");
  }
  if (
    metrics.payment_failures_last_90d &&
    metrics.payment_failures_last_90d > 1
  ) {
    risk += 0.1;
    factors.push("Multiple payment issues");
  }

  // Engagement signals
  if (
    metrics.days_since_last_login !== undefined &&
    metrics.days_since_last_login > 21
  ) {
    risk += 0.15;
    factors.push("No logins in 3+ weeks");
  }

  // Support signals
  if (metrics.open_tickets !== undefined && metrics.open_tickets > 3) {
    risk += 0.1;
    factors.push("High open support ticket count");
  }

  // NPS signals
  if (metrics.nps_score !== undefined && metrics.nps_score < -20) {
    risk += 0.1;
    factors.push("Very low NPS score");
  }

  const clampedRisk = Math.min(0.99, Math.max(0.01, risk));
  let label: string;
  if (clampedRisk < 0.2) label = "low";
  else if (clampedRisk < 0.45) label = "medium";
  else if (clampedRisk < 0.7) label = "high";
  else label = "critical";

  return { risk: clampedRisk, label, factors };
}
