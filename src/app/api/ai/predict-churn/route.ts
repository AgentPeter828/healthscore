import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  calculateAllScores,
  calculateOverallScore,
  predictChurnRisk,
  type RawMetrics,
} from "@/lib/health-score-engine";
import type { FormulaComponent } from "@/lib/types";

// AI Churn Risk Prediction — Feature 5
// Analyzes all accounts and updates their churn risk scores
// Can optionally use Anthropic Claude API for enhanced predictions

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, organization:hs_organizations(plan)")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) return NextResponse.json({ error: "No org" }, { status: 400 });

  // Only Starter+ can run AI predictions
  const org = Array.isArray(profile.organization) ? profile.organization[0] : profile.organization;
  const plan = (org as { plan?: string })?.plan;
  if (plan === "free") {
    return NextResponse.json(
      { error: "AI predictions require Starter plan or higher" },
      { status: 403 }
    );
  }

  const orgId = profile.organization_id;
  const serviceClient = await createServiceClient();

  // Fetch all active accounts with their health scores and history
  const [{ data: accounts }, { data: formula }] = await Promise.all([
    serviceClient
      .from("hs_accounts")
      .select("id, name, mrr, renewal_date, health_score:hs_health_scores(*)")
      .eq("organization_id", orgId)
      .eq("status", "active"),
    serviceClient
      .from("hs_health_score_formulas")
      .select("components")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .single(),
  ]);

  if (!accounts?.length) {
    return NextResponse.json({ message: "No accounts to analyze", predictions: [] });
  }

  const formulaComponents = (formula?.components as FormulaComponent[]) || [];
  const predictions: any[] = [];
  let updatedCount = 0;

  for (const account of accounts) {
    const healthScore = Array.isArray(account.health_score)
      ? account.health_score[0]
      : account.health_score as Record<string, unknown> | null;

    const metrics = (healthScore?.raw_metrics as RawMetrics) || {};

    // Get score history for trend analysis
    const { data: history } = await serviceClient
      .from("hs_health_score_history")
      .select("overall_score, snapshot_date")
      .eq("account_id", account.id)
      .order("snapshot_date", { ascending: false })
      .limit(14);

    const historyScores = (history || []).map((h) => h.overall_score);

    // Recalculate component scores
    const componentScores = calculateAllScores(metrics);
    const overallScore = calculateOverallScore(componentScores, formulaComponents);
    const { risk, label, factors } = predictChurnRisk(overallScore, historyScores, metrics);

    // Enhanced prediction: weight trend more heavily if renewal is coming up
    let adjustedRisk = risk;
    if (account.renewal_date) {
      const daysUntilRenewal = Math.max(
        0,
        Math.ceil(
          (new Date(account.renewal_date).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      );
      // Amplify risk signal when renewal is approaching
      if (daysUntilRenewal <= 30 && risk > 0.3) {
        adjustedRisk = Math.min(0.99, risk * 1.3);
      } else if (daysUntilRenewal <= 60 && risk > 0.4) {
        adjustedRisk = Math.min(0.99, risk * 1.15);
      }
    }

    // Get recommended actions based on risk factors
    const recommendedActions = generateRecommendations(factors, label, metrics);

    // Update health score with prediction
    await serviceClient.from("hs_health_scores").upsert({
      organization_id: orgId,
      account_id: account.id,
      overall_score: overallScore,
      ...componentScores,
      churn_risk: adjustedRisk,
      churn_risk_label: adjustedRisk >= 0.7 ? "critical" :
        adjustedRisk >= 0.45 ? "high" :
        adjustedRisk >= 0.2 ? "medium" : "low",
      churn_predicted_at: new Date().toISOString(),
      calculated_at: new Date().toISOString(),
    }, { onConflict: "account_id" });

    // Update segment
    const segment = overallScore >= 70 ? "green" : overallScore >= 40 ? "yellow" : "red";
    await serviceClient.from("hs_accounts")
      .update({ segment })
      .eq("id", account.id);

    updatedCount++;
    predictions.push({
      account_id: account.id,
      account_name: account.name,
      current_score: overallScore,
      predicted_churn_probability: Math.round(adjustedRisk * 100),
      risk_label: label,
      key_factors: factors,
      recommended_actions: recommendedActions,
    });
  }

  // Sort by risk descending
  predictions.sort((a, b) => b.predicted_churn_probability - a.predicted_churn_probability);

  return NextResponse.json({
    message: `Analyzed ${updatedCount} accounts`,
    predictions,
    analyzed_at: new Date().toISOString(),
  });
}

function generateRecommendations(
  factors: string[],
  riskLabel: string,
  metrics: RawMetrics
): string[] {
  const actions: string[] = [];

  if (metrics.last_payment_status === "failed") {
    actions.push("Contact account to resolve payment issue immediately");
  }
  if (metrics.days_since_last_login !== undefined && metrics.days_since_last_login > 14) {
    actions.push("Schedule a check-in call — account hasn't logged in recently");
  }
  if (metrics.open_tickets !== undefined && metrics.open_tickets > 2) {
    actions.push("Escalate open support tickets to reduce friction");
  }
  if (metrics.nps_score !== undefined && metrics.nps_score < 0) {
    actions.push("Follow up on negative NPS feedback");
  }
  if (riskLabel === "critical" || riskLabel === "high") {
    actions.push("Add to at-risk segment and assign dedicated CSM attention");
    actions.push("Send personalized outreach within 24 hours");
  }
  if (
    metrics.features_used !== undefined &&
    metrics.total_features_available !== undefined &&
    metrics.features_used / metrics.total_features_available < 0.3
  ) {
    actions.push("Schedule feature training session to improve adoption");
  }

  return actions.slice(0, 3); // Top 3 recommendations
}
