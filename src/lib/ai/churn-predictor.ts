// AI Churn Predictor — uses Claude or OpenAI to analyze account data
// Falls back to local heuristic engine if no AI API keys are configured

import { predictChurnRisk as localPredict, type RawMetrics } from "@/lib/health-score-engine";

interface AccountData {
  name: string;
  mrr: number;
  overallScore: number;
  componentScores: {
    usage_score: number;
    support_score: number;
    billing_score: number;
    engagement_score: number;
    nps_score: number;
    feature_adoption_score: number;
  };
  metrics: RawMetrics;
  scoreHistory: number[];
  renewalDate?: string;
  daysSinceLastActivity?: number;
}

interface AIPrediction {
  probability: number; // 0-1
  risk_level: "low" | "medium" | "high" | "critical";
  factors: string[];
  recommendation: string;
}

function buildPrompt(account: AccountData): string {
  const daysUntilRenewal = account.renewalDate
    ? Math.ceil((new Date(account.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const trendDirection =
    account.scoreHistory.length >= 2
      ? account.scoreHistory[0] - account.scoreHistory[account.scoreHistory.length - 1]
      : 0;

  return `Analyze this B2B SaaS customer's data and predict churn probability. Return ONLY valid JSON.

Customer: ${account.name}
MRR: $${account.mrr}
Overall Health Score: ${account.overallScore}/100
Score Trend (last 14 days): ${trendDirection > 0 ? "+" : ""}${trendDirection} points

Component Scores (0-100):
- Product Usage: ${account.componentScores.usage_score}
- Support Health: ${account.componentScores.support_score}
- Billing Health: ${account.componentScores.billing_score}
- Login Engagement: ${account.componentScores.engagement_score}
- NPS Score: ${account.componentScores.nps_score}
- Feature Adoption: ${account.componentScores.feature_adoption_score}

Key Metrics:
- Days since last login: ${account.metrics.days_since_last_login ?? "unknown"}
- Open support tickets: ${account.metrics.open_tickets ?? 0}
- Payment failures (90d): ${account.metrics.payment_failures_last_90d ?? 0}
- Last payment status: ${account.metrics.last_payment_status ?? "unknown"}
- NPS raw score: ${account.metrics.nps_score ?? "not collected"}
${daysUntilRenewal !== null ? `- Days until renewal: ${daysUntilRenewal}` : ""}

Score History (recent first): [${account.scoreHistory.slice(0, 10).join(", ")}]

Return JSON with this exact structure:
{
  "probability": <number 0-1>,
  "risk_level": "<low|medium|high|critical>",
  "factors": ["<top 3 risk factors>"],
  "recommendation": "<one sentence actionable recommendation>"
}`;
}

function parseAIResponse(text: string): AIPrediction | null {
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (
      typeof parsed.probability !== "number" ||
      !["low", "medium", "high", "critical"].includes(parsed.risk_level) ||
      !Array.isArray(parsed.factors)
    ) {
      return null;
    }

    return {
      probability: Math.max(0, Math.min(1, parsed.probability)),
      risk_level: parsed.risk_level,
      factors: parsed.factors.slice(0, 5).map(String),
      recommendation: String(parsed.recommendation || "Monitor this account closely."),
    };
  } catch {
    return null;
  }
}

async function predictWithClaude(prompt: string): Promise<AIPrediction | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") return null;
    return parseAIResponse(content.text);
  } catch (err) {
    console.warn("Claude prediction failed:", err);
    return null;
  }
}

async function predictWithOpenAI(prompt: string): Promise<AIPrediction | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content: "You are a B2B SaaS churn prediction analyst. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
    });

    const text = response.choices[0]?.message?.content;
    if (!text) return null;
    return parseAIResponse(text);
  } catch (err) {
    console.warn("OpenAI prediction failed:", err);
    return null;
  }
}

/**
 * Predict churn using AI (Claude or OpenAI) with fallback to local heuristic engine.
 */
export async function predictChurn(account: AccountData): Promise<AIPrediction> {
  const prompt = buildPrompt(account);

  // Try Claude first, then OpenAI, then fall back to local
  let prediction = await predictWithClaude(prompt);
  if (!prediction) {
    prediction = await predictWithOpenAI(prompt);
  }

  if (prediction) {
    return prediction;
  }

  // Fallback to local heuristic engine
  console.info("AI churn prediction unavailable, using local engine");
  const { risk, label, factors } = localPredict(
    account.overallScore,
    account.scoreHistory,
    account.metrics
  );

  return {
    probability: risk,
    risk_level: label as AIPrediction["risk_level"],
    factors,
    recommendation: generateLocalRecommendation(factors, label, account.metrics),
  };
}

function generateLocalRecommendation(
  factors: string[],
  riskLevel: string,
  metrics: RawMetrics
): string {
  if (riskLevel === "critical") {
    return "Immediate executive outreach recommended — this account shows multiple critical risk signals.";
  }
  if (metrics.last_payment_status === "failed") {
    return "Resolve payment issue immediately and schedule a check-in call.";
  }
  if (metrics.days_since_last_login !== undefined && metrics.days_since_last_login > 14) {
    return "Schedule a re-engagement call — the account has been inactive for over 2 weeks.";
  }
  if (metrics.open_tickets !== undefined && metrics.open_tickets > 2) {
    return "Prioritize resolving open support tickets to reduce friction.";
  }
  if (riskLevel === "high") {
    return "Assign dedicated CSM attention and create a proactive success plan.";
  }
  return "Continue monitoring and maintain regular check-in cadence.";
}
