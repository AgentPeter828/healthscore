import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  calculateAllScores,
  calculateOverallScore,
  type RawMetrics,
} from "@/lib/health-score-engine";
import { predictChurn } from "@/lib/ai/churn-predictor";
import { rateLimitAI } from "@/lib/rate-limit";
import { sendChurnWarningEmail } from "@/lib/email/resend";
import type { FormulaComponent } from "@/lib/types";

// AI Churn Risk Prediction — Feature 5
// Uses real AI (Claude/OpenAI) with local heuristic fallback
// Accepts optional accountId to filter to a single account

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Parse optional body
  let body: { accountId?: string } = {};
  try {
    body = await request.json();
  } catch {
    // No body is fine — analyze all accounts
  }

  const { accountId } = body;

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

  // Rate limit AI predictions: 10/min per org
  const rl = await rateLimitAI(request, orgId);
  if (!rl.success) {
    return NextResponse.json(
      { error: "AI prediction rate limit exceeded. Try again shortly." },
      { status: 429 }
    );
  }

  const serviceClient = await createServiceClient();

  // Fetch accounts (optionally filtered by accountId)
  let accountQuery = serviceClient
    .from("hs_accounts")
    .select("id, name, mrr, renewal_date, health_score:hs_health_scores(*)")
    .eq("organization_id", orgId)
    .eq("status", "active");

  if (accountId) {
    accountQuery = accountQuery.eq("id", accountId);
  }

  const [{ data: accounts }, { data: formula }] = await Promise.all([
    accountQuery,
    serviceClient
      .from("hs_health_score_formulas")
      .select("components")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .single(),
  ]);

  // If specific account requested but not found
  if (accountId && (!accounts || accounts.length === 0)) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (!accounts?.length) {
    return NextResponse.json({ message: "No accounts to analyze", predictions: [] });
  }

  const formulaComponents = (formula?.components as FormulaComponent[]) || [];
  const predictions: Record<string, unknown>[] = [];
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

    // Use AI churn predictor (Claude/OpenAI with local fallback)
    const aiPrediction = await predictChurn({
      name: account.name,
      mrr: account.mrr,
      overallScore,
      componentScores,
      metrics,
      scoreHistory: historyScores,
      renewalDate: account.renewal_date,
      daysSinceLastActivity: metrics.days_since_last_login,
    });

    // Enhanced prediction: weight trend more heavily if renewal is coming up
    let adjustedRisk = aiPrediction.probability;
    if (account.renewal_date) {
      const daysUntilRenewal = Math.max(
        0,
        Math.ceil(
          (new Date(account.renewal_date).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      );
      if (daysUntilRenewal <= 30 && adjustedRisk > 0.3) {
        adjustedRisk = Math.min(0.99, adjustedRisk * 1.3);
      } else if (daysUntilRenewal <= 60 && adjustedRisk > 0.4) {
        adjustedRisk = Math.min(0.99, adjustedRisk * 1.15);
      }
    }

    const riskLabel = adjustedRisk >= 0.7 ? "critical" :
      adjustedRisk >= 0.45 ? "high" :
      adjustedRisk >= 0.2 ? "medium" : "low";

    // Update health score with prediction
    await serviceClient.from("hs_health_scores").upsert({
      organization_id: orgId,
      account_id: account.id,
      overall_score: overallScore,
      ...componentScores,
      churn_risk: adjustedRisk,
      churn_risk_label: riskLabel,
      churn_predicted_at: new Date().toISOString(),
      calculated_at: new Date().toISOString(),
    }, { onConflict: "account_id" });

    // Update segment
    const segment = overallScore >= 70 ? "green" : overallScore >= 40 ? "yellow" : "red";
    await serviceClient.from("hs_accounts")
      .update({ segment })
      .eq("id", account.id);

    // Send churn warning email for high/critical risk accounts
    if (riskLabel === "critical" || riskLabel === "high") {
      // Best-effort email — don't block on failure
      sendChurnWarningEmail(
        user.email || "",
        account.name,
        riskLabel,
        adjustedRisk,
        aiPrediction.factors,
        aiPrediction.recommendation
      ).catch(() => {});
    }

    updatedCount++;
    predictions.push({
      account_id: account.id,
      account_name: account.name,
      current_score: overallScore,
      predicted_churn_probability: Math.round(adjustedRisk * 100),
      risk_label: riskLabel,
      key_factors: aiPrediction.factors,
      recommended_actions: [aiPrediction.recommendation],
      ai_recommendation: aiPrediction.recommendation,
    });
  }

  // Sort by risk descending
  predictions.sort((a, b) =>
    (b.predicted_churn_probability as number) - (a.predicted_churn_probability as number)
  );

  return NextResponse.json({
    message: `Analyzed ${updatedCount} accounts`,
    predictions,
    analyzed_at: new Date().toISOString(),
  });
}
