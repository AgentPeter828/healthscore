import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  calculateAllScores,
  calculateOverallScore,
  predictChurnRisk,
  type RawMetrics,
} from "@/lib/health-score-engine";
import type { FormulaComponent } from "@/lib/types";

// Process incoming webhooks from all integrations
// URL: /api/webhooks/[integrationId]?secret=[webhook_secret]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  const { integrationId } = await params;
  const secret = request.nextUrl.searchParams.get("secret");

  if (!secret) {
    return NextResponse.json({ error: "Missing secret" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  // Verify integration exists and secret matches
  const { data: integration } = await supabase
    .from("hs_integrations")
    .select("*, organization:hs_organizations(id, plan)")
    .eq("id", integrationId)
    .eq("webhook_secret", secret)
    .eq("is_active", true)
    .single();

  if (!integration) {
    return NextResponse.json({ error: "Invalid integration" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const orgId = integration.organization_id;

  // Store the raw webhook event
  const { data: event } = await supabase
    .from("hs_webhook_events")
    .insert({
      organization_id: orgId,
      integration_id: integrationId,
      event_type: extractEventType(integration.type, payload),
      source: integration.type,
      payload,
      processed: false,
    })
    .select()
    .single();

  // Update integration stats
  await supabase
    .from("hs_integrations")
    .update({
      last_event_at: new Date().toISOString(),
      event_count: (integration.event_count || 0) + 1,
    })
    .eq("id", integrationId);

  // Process the event asynchronously
  if (event) {
    processWebhookEvent(event.id, integration.type, payload, orgId, supabase).catch(
      console.error
    );
  }

  return NextResponse.json({ received: true, event_id: event?.id });
}

function extractEventType(
  integrationType: string,
  payload: Record<string, unknown>
): string {
  switch (integrationType) {
    case "stripe":
      return (payload.type as string) || "stripe.event";
    case "intercom":
      return (payload.topic as string) || "intercom.event";
    case "zendesk":
      return `zendesk.${(payload.detail_type as string) || "event"}`;
    case "helpscout":
      return `helpscout.${(payload.eventType as string) || "event"}`;
    case "segment":
      return `segment.${(payload.type as string) || "event"}`;
    case "mixpanel":
      return "mixpanel.event";
    case "amplitude":
      return "amplitude.event";
    default:
      return `${integrationType}.event`;
  }
}

async function processWebhookEvent(
  eventId: string,
  integrationType: string,
  payload: Record<string, unknown>,
  orgId: string,
  supabase: Awaited<ReturnType<typeof createServiceClient>>
) {
  try {
    // Find or create the associated account
    const accountId = await findOrCreateAccount(
      integrationType,
      payload,
      orgId,
      supabase
    );

    if (!accountId) {
      await supabase
        .from("hs_webhook_events")
        .update({ processed: true, error: "Could not identify account" })
        .eq("id", eventId);
      return;
    }

    // Update the event with the account ID
    await supabase
      .from("hs_webhook_events")
      .update({ account_id: accountId })
      .eq("id", eventId);

    // Apply metrics update based on event type
    await applyMetricsUpdate(integrationType, payload, accountId, orgId, supabase);

    // Recalculate health score
    await recalculateHealthScore(accountId, orgId, supabase);

    // Check playbook triggers
    await checkPlaybookTriggers(accountId, orgId, supabase);

    // Mark event as processed
    await supabase
      .from("hs_webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("id", eventId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("hs_webhook_events")
      .update({ processed: true, error: message })
      .eq("id", eventId);
  }
}

async function findOrCreateAccount(
  integrationType: string,
  payload: Record<string, unknown>,
  orgId: string,
  supabase: Awaited<ReturnType<typeof createServiceClient>>
): Promise<string | null> {
  let externalId: string | null = null;
  let accountName: string | null = null;
  let domain: string | null = null;
  let mrr: number | null = null;

  switch (integrationType) {
    case "stripe": {
      const customer = payload.data as Record<string, unknown>;
      const customerObj = customer?.object as Record<string, unknown>;
      externalId = (customerObj?.customer as string) || (customerObj?.id as string);
      accountName = customerObj?.name as string || customerObj?.description as string;
      const amount = customerObj?.amount as number;
      if (amount) mrr = amount / 100;
      break;
    }
    case "intercom": {
      const data = payload.data as Record<string, unknown>;
      const contact = data?.item as Record<string, unknown>;
      externalId = contact?.company_id as string || contact?.id as string;
      accountName = contact?.name as string;
      domain = contact?.website as string;
      break;
    }
    case "zendesk": {
      const detail = payload.detail as Record<string, unknown>;
      const org = detail?.organization as Record<string, unknown>;
      externalId = org?.id?.toString() || detail?.requester_id?.toString() || null;
      accountName = org?.name as string;
      domain = ((org?.domain_names as string[]) || [])[0] || null;
      break;
    }
    case "helpscout": {
      const data = payload as Record<string, unknown>;
      externalId = (data.company as Record<string, unknown>)?.id as string;
      accountName = (data.company as Record<string, unknown>)?.name as string;
      break;
    }
    case "segment":
    case "mixpanel":
    case "amplitude": {
      const data = payload as Record<string, unknown>;
      externalId =
        (data.userId as string) ||
        (data.groupId as string) ||
        (data.company_id as string);
      accountName = (data.traits as Record<string, unknown>)?.name as string ||
        (data.group as Record<string, unknown>)?.name as string;
      break;
    }
  }

  if (!externalId && !accountName) return null;

  // Try to find existing account
  const query = supabase
    .from("hs_accounts")
    .select("id")
    .eq("organization_id", orgId);

  if (externalId) {
    const { data: existing } = await query.eq("external_id", externalId).single();
    if (existing) return existing.id;
  }

  if (accountName) {
    const { data: existing } = await supabase
      .from("hs_accounts")
      .select("id")
      .eq("organization_id", orgId)
      .ilike("name", accountName)
      .single();
    if (existing) return existing.id;
  }

  // Create new account
  const { data: newAccount } = await supabase
    .from("hs_accounts")
    .insert({
      organization_id: orgId,
      name: accountName || externalId || "Unknown Account",
      domain,
      external_id: externalId,
      mrr: mrr || 0,
      status: "active",
      segment: "yellow",
    })
    .select("id")
    .single();

  return newAccount?.id || null;
}

async function applyMetricsUpdate(
  integrationType: string,
  payload: Record<string, unknown>,
  accountId: string,
  orgId: string,
  supabase: Awaited<ReturnType<typeof createServiceClient>>
) {
  // Fetch current raw_metrics for this account
  const { data: currentScore } = await supabase
    .from("hs_health_scores")
    .select("raw_metrics")
    .eq("account_id", accountId)
    .single();

  const currentMetrics: RawMetrics = (currentScore?.raw_metrics as RawMetrics) || {};
  const updatedMetrics: RawMetrics = { ...currentMetrics };

  switch (integrationType) {
    case "stripe": {
      const eventType = payload.type as string;
      const data = (payload.data as Record<string, unknown>)?.object as Record<string, unknown>;

      if (eventType === "invoice.payment_failed") {
        updatedMetrics.last_payment_status = "failed";
        updatedMetrics.payment_failures_last_90d =
          (updatedMetrics.payment_failures_last_90d || 0) + 1;
        // Create alert
        await createAlert(accountId, orgId, "payment_failed", "critical",
          "Payment Failed", `Payment failed for this account`, supabase);
      } else if (eventType === "invoice.payment_succeeded") {
        updatedMetrics.last_payment_status = "succeeded";
        // Update MRR
        const amount = data?.amount_paid as number;
        if (amount) {
          await supabase.from("hs_accounts").update({ mrr: amount / 100 }).eq("id", accountId);
        }
      } else if (eventType === "customer.subscription.updated") {
        const prevAttrs = (payload.data as Record<string, unknown>)?.previous_attributes as Record<string, unknown>;
        if (prevAttrs?.plan) {
          updatedMetrics.plan_downgrades_last_90d =
            (updatedMetrics.plan_downgrades_last_90d || 0) + 1;
        }
      }
      break;
    }
    case "intercom":
    case "helpscout":
    case "zendesk": {
      const eventType = payload.topic as string || payload.type as string;
      if (eventType?.includes("conversation.created") || eventType?.includes("ticket.created")) {
        updatedMetrics.open_tickets = (updatedMetrics.open_tickets || 0) + 1;
        updatedMetrics.tickets_last_30d = (updatedMetrics.tickets_last_30d || 0) + 1;
      } else if (eventType?.includes("conversation.closed") || eventType?.includes("ticket.solved")) {
        updatedMetrics.open_tickets = Math.max(0, (updatedMetrics.open_tickets || 1) - 1);
      }
      // CSAT
      const rating = (payload.rating as Record<string, unknown>)?.value as number;
      if (rating) updatedMetrics.csat_score = rating;
      break;
    }
    case "segment":
    case "mixpanel":
    case "amplitude": {
      updatedMetrics.events_last_30d = (updatedMetrics.events_last_30d || 0) + 1;
      // Check for specific events
      const event = payload.event as string || payload.type as string;
      if (event?.toLowerCase().includes("login") || event?.toLowerCase().includes("sign_in")) {
        updatedMetrics.days_since_last_login = 0;
      }
      break;
    }
  }

  // Upsert the health score with new raw metrics
  await supabase.from("hs_health_scores").upsert({
    organization_id: orgId,
    account_id: accountId,
    raw_metrics: updatedMetrics,
    calculated_at: new Date().toISOString(),
  }, { onConflict: "account_id" });
}

async function recalculateHealthScore(
  accountId: string,
  orgId: string,
  supabase: Awaited<ReturnType<typeof createServiceClient>>
) {
  // Get current metrics and formula
  const [{ data: scoreData }, { data: formula }] = await Promise.all([
    supabase
      .from("hs_health_scores")
      .select("raw_metrics")
      .eq("account_id", accountId)
      .single(),
    supabase
      .from("hs_health_score_formulas")
      .select("components")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .single(),
  ]);

  const metrics = (scoreData?.raw_metrics as RawMetrics) || {};
  const formulaComponents = (formula?.components as FormulaComponent[]) || [];

  const componentScores = calculateAllScores(metrics);
  const overallScore = calculateOverallScore(componentScores, formulaComponents);

  // Get score history for trend
  const { data: history } = await supabase
    .from("hs_health_score_history")
    .select("overall_score")
    .eq("account_id", accountId)
    .order("snapshot_date", { ascending: false })
    .limit(10);

  const historyScores = (history || []).map((h) => h.overall_score);
  const { risk, label, factors } = predictChurnRisk(overallScore, historyScores, metrics);

  // Determine segment
  const segment = overallScore >= 70 ? "green" : overallScore >= 40 ? "yellow" : "red";

  // Update health score
  await supabase.from("hs_health_scores").upsert({
    organization_id: orgId,
    account_id: accountId,
    overall_score: overallScore,
    ...componentScores,
    raw_metrics: metrics,
    churn_risk: risk,
    churn_risk_label: label,
    churn_predicted_at: new Date().toISOString(),
    calculated_at: new Date().toISOString(),
  }, { onConflict: "account_id" });

  // Update account segment
  await supabase.from("hs_accounts").update({ segment }).eq("id", accountId);

  // Save to history (once per day)
  const today = new Date().toISOString().split("T")[0];
  await supabase.from("hs_health_score_history").upsert({
    organization_id: orgId,
    account_id: accountId,
    overall_score: overallScore,
    ...componentScores,
    churn_risk: risk,
    snapshot_date: today,
  }, { onConflict: "account_id,snapshot_date" });

  // Also try plain insert for databases without the unique constraint
  await supabase.from("hs_health_score_history").insert({
      organization_id: orgId,
      account_id: accountId,
      overall_score: overallScore,
      ...componentScores,
      churn_risk: risk,
      snapshot_date: today,
    });

  // Alert if churn risk is high
  if (label === "critical" || label === "high") {
    await createAlert(
      accountId, orgId, "churn_risk",
      label === "critical" ? "critical" : "high",
      `${label === "critical" ? "🚨 Critical" : "⚠️ High"} churn risk detected`,
      `Account health score: ${overallScore}. Key factors: ${factors.slice(0, 2).join(", ")}`,
      supabase
    );
  }

  return { overallScore, segment, churnRisk: risk, churnRiskLabel: label };
}

async function checkPlaybookTriggers(
  accountId: string,
  orgId: string,
  supabase: Awaited<ReturnType<typeof createServiceClient>>
) {
  const [{ data: account }, { data: playbooks }] = await Promise.all([
    supabase
      .from("hs_accounts")
      .select("*, health_score:hs_health_scores(*)")
      .eq("id", accountId)
      .single(),
    supabase
      .from("hs_playbooks")
      .select("*, actions:hs_playbook_actions(*)")
      .eq("organization_id", orgId)
      .eq("is_active", true),
  ]);

  if (!account || !playbooks) return;

  const healthScore = Array.isArray(account.health_score)
    ? account.health_score[0]
    : account.health_score;

  for (const playbook of playbooks) {
    const triggered = evaluatePlaybookTrigger(playbook, account, healthScore);
    if (triggered) {
      await executePlaybook(playbook, account, orgId, supabase);
    }
  }
}

function evaluatePlaybookTrigger(
  playbook: Record<string, unknown>,
  account: Record<string, unknown>,
  healthScore: Record<string, unknown> | null
): boolean {
  const config = playbook.trigger_config as Record<string, unknown>;
  const score = (healthScore?.overall_score as number) || 50;

  switch (playbook.trigger_type) {
    case "score_threshold":
      return score < (config.score_below as number);
    case "churn_risk":
      return healthScore?.churn_risk_label === config.risk_level;
    case "segment_change":
      return account.segment === config.new_segment;
    default:
      return false;
  }
}

async function executePlaybook(
  playbook: Record<string, unknown>,
  account: Record<string, unknown>,
  orgId: string,
  supabase: Awaited<ReturnType<typeof createServiceClient>>
) {
  const actions = (playbook.actions as Array<Record<string, unknown>>) || [];

  // Create a playbook run record
  const { data: run } = await supabase
    .from("hs_playbook_runs")
    .insert({
      playbook_id: playbook.id,
      account_id: account.id,
      organization_id: orgId,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  let actionsCompleted = 0;
  let actionsFailed = 0;

  for (const action of actions.sort((a, b) => (a.sort_order as number) - (b.sort_order as number))) {
    try {
      await executeAction(action, account, orgId, supabase);
      actionsCompleted++;
    } catch {
      actionsFailed++;
    }
  }

  if (run) {
    await supabase
      .from("hs_playbook_runs")
      .update({
        status: actionsFailed > 0 && actionsCompleted === 0 ? "failed" : "completed",
        actions_completed: actionsCompleted,
        actions_failed: actionsFailed,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);
  }

  // Update playbook run count
  await supabase
    .from("hs_playbooks")
    .update({
      run_count: ((playbook.run_count as number) || 0) + 1,
      last_run_at: new Date().toISOString(),
    })
    .eq("id", playbook.id);
}

async function executeAction(
  action: Record<string, unknown>,
  account: Record<string, unknown>,
  orgId: string,
  supabase: Awaited<ReturnType<typeof createServiceClient>>
) {
  const config = action.config as Record<string, unknown>;

  // Template variable replacement
  const replace = (str: string) =>
    str
      .replace(/\{\{account_name\}\}/g, account.name as string)
      .replace(/\{\{score\}\}/g, String((account as Record<string, unknown>).overall_score || "N/A"))
      .replace(/\{\{mrr\}\}/g, `$${account.mrr || 0}`)
      .replace(/\{\{segment\}\}/g, account.segment as string);

  switch (action.action_type) {
    case "slack_alert": {
      const slackWebhookUrl = config.webhook_url as string;
      if (!slackWebhookUrl) break;
      await fetch(slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: config.channel,
          text: replace(config.message as string || `⚠️ Account ${account.name} health alert`),
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: replace(config.message as string || `⚠️ *${account.name}* needs attention`),
              },
            },
          ],
        }),
      });
      break;
    }
    case "update_segment": {
      await supabase
        .from("hs_accounts")
        .update({ segment: config.new_segment })
        .eq("id", account.id);
      break;
    }
    case "webhook": {
      const url = config.url as string;
      if (!url) break;
      await fetch(url, {
        method: (config.method as string) || "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, config }),
      });
      break;
    }
  }

  // Create an alert for the action
  await createAlert(
    account.id as string,
    orgId,
    "playbook",
    "medium",
    `Playbook action: ${action.action_type}`,
    `Executed for account ${account.name}`,
    supabase
  );
}

async function createAlert(
  accountId: string,
  orgId: string,
  type: string,
  severity: string,
  title: string,
  message: string,
  supabase: Awaited<ReturnType<typeof createServiceClient>>
) {
  // Don't duplicate recent identical alerts (within 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from("hs_alerts")
    .select("id")
    .eq("account_id", accountId)
    .eq("type", type)
    .eq("is_resolved", false)
    .gte("created_at", oneHourAgo)
    .limit(1)
    .single();

  if (existing) return;

  await supabase.from("hs_alerts").insert({
    organization_id: orgId,
    account_id: accountId,
    type,
    severity,
    title,
    message,
    is_read: false,
    is_resolved: false,
  });
}
