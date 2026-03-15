import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe, PLANS, getPlanFromPriceId, type PlanKey } from "@/lib/stripe";

const isMock = process.env.NEXT_PUBLIC_MOCK_DATA === "true";

export async function POST(req: NextRequest) {
  if (isMock) {
    return NextResponse.json({
      success: true,
      message: "Plan updated (mock)",
      plan: "growth",
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id)
    return NextResponse.json({ error: "No org" }, { status: 400 });

  if (profile.role !== "owner" && profile.role !== "admin")
    return NextResponse.json(
      { error: "Only admins can change plans" },
      { status: 403 }
    );

  const { newPlanId } = (await req.json()) as { newPlanId: PlanKey };
  if (!newPlanId || !PLANS[newPlanId])
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const newPlan = PLANS[newPlanId];

  const serviceClient = await createServiceClient();

  // Fetch org
  const { data: org } = await serviceClient
    .from("hs_organizations")
    .select("*")
    .eq("id", profile.organization_id)
    .single();

  if (!org)
    return NextResponse.json({ error: "Org not found" }, { status: 404 });

  // If downgrading to free, cancel subscription
  if (newPlanId === "free") {
    if (org.stripe_subscription_id) {
      await stripe.subscriptions.cancel(org.stripe_subscription_id);
    }
    await serviceClient
      .from("hs_organizations")
      .update({
        plan: "free",
        plan_status: "active",
        max_accounts: PLANS.free.maxAccounts,
        max_integrations: PLANS.free.maxIntegrations,
      })
      .eq("id", org.id);

    // Audit log
    await serviceClient.from("hs_audit_log").insert({
      organization_id: org.id,
      user_id: user.id,
      action: "plan_downgraded",
      details: { from: org.plan, to: "free" },
    });

    return NextResponse.json({ success: true, plan: "free" });
  }

  // For paid plans, update Stripe subscription
  if (!newPlan.priceId)
    return NextResponse.json(
      { error: "Price not configured" },
      { status: 500 }
    );

  if (org.stripe_subscription_id) {
    // Update existing subscription
    const subscription = await stripe.subscriptions.retrieve(
      org.stripe_subscription_id
    );
    await stripe.subscriptions.update(org.stripe_subscription_id, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPlan.priceId,
        },
      ],
      proration_behavior: "create_prorations",
    });
  } else {
    // No existing subscription — redirect to checkout instead
    return NextResponse.json(
      { error: "No subscription found. Use checkout instead." },
      { status: 400 }
    );
  }

  // Update org
  const isUpgrade =
    Object.keys(PLANS).indexOf(newPlanId) >
    Object.keys(PLANS).indexOf(org.plan);

  await serviceClient
    .from("hs_organizations")
    .update({
      plan: newPlanId,
      max_accounts: newPlan.maxAccounts === -1 ? 999999 : newPlan.maxAccounts,
      max_integrations:
        newPlan.maxIntegrations === -1 ? 999999 : newPlan.maxIntegrations,
    })
    .eq("id", org.id);

  // Audit log
  await serviceClient.from("hs_audit_log").insert({
    organization_id: org.id,
    user_id: user.id,
    action: isUpgrade ? "plan_upgraded" : "plan_downgraded",
    details: { from: org.plan, to: newPlanId },
  });

  return NextResponse.json({ success: true, plan: newPlanId });
}
