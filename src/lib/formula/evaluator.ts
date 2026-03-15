// Formula Evaluator — evaluates health score formulas against real account data

import type { FormulaComponent } from "@/lib/types";
import {
  calculateAllScores,
  type RawMetrics,
} from "@/lib/health-score-engine";

interface MetricBreakdown {
  metric: string;
  label: string;
  value: number;
  weight: number;
  contribution: number;
}

interface EvaluationResult {
  score: number;
  breakdown: MetricBreakdown[];
}

/**
 * Map formula component keys to calculated score fields.
 */
const COMPONENT_KEY_MAP: Record<string, keyof ReturnType<typeof calculateAllScores>> = {
  usage: "usage_score",
  support: "support_score",
  billing: "billing_score",
  engagement: "engagement_score",
  nps: "nps_score",
  feature_adoption: "feature_adoption_score",
};

/**
 * Evaluate a formula against an account's raw metrics.
 * Returns the weighted overall score and a breakdown per component.
 */
export function evaluateFormula(
  components: FormulaComponent[],
  rawMetrics: RawMetrics
): EvaluationResult {
  const scores = calculateAllScores(rawMetrics);
  const enabledComponents = components.filter((c) => c.enabled);

  if (enabledComponents.length === 0) {
    return { score: 50, breakdown: [] };
  }

  const totalWeight = enabledComponents.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) {
    return { score: 50, breakdown: [] };
  }

  let weightedSum = 0;
  const breakdown: MetricBreakdown[] = [];

  for (const component of enabledComponents) {
    const scoreKey = COMPONENT_KEY_MAP[component.key];
    const value = scoreKey ? scores[scoreKey] : 50;
    const normalizedWeight = component.weight / totalWeight;
    const contribution = value * normalizedWeight;

    weightedSum += contribution;
    breakdown.push({
      metric: component.key,
      label: component.label,
      value,
      weight: component.weight,
      contribution: Math.round(contribution * 100) / 100,
    });
  }

  return {
    score: Math.round(Math.max(0, Math.min(100, weightedSum))),
    breakdown,
  };
}

/**
 * Default formula components used when no custom formula is configured.
 */
export const DEFAULT_FORMULA_COMPONENTS: FormulaComponent[] = [
  { key: "usage", label: "Product Usage", weight: 30, enabled: true },
  { key: "support", label: "Support Health", weight: 20, enabled: true },
  { key: "billing", label: "Billing Health", weight: 20, enabled: true },
  { key: "engagement", label: "Login Frequency", weight: 15, enabled: true },
  { key: "nps", label: "NPS Score", weight: 10, enabled: true },
  { key: "feature_adoption", label: "Feature Adoption", weight: 5, enabled: true },
];
