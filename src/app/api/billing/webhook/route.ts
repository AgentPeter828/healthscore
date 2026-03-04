import { NextRequest, NextResponse } from "next/server";
import { stripe, getPlanFromPriceId, PLANS } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  const supabase = await createServiceClient();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.organization_id;
      if (!orgId) break;

      const priceId = sub.items.data[0]?.price?.id || "";
      const plan = getPlanFromPriceId(priceId);
      const planConfig = PLANS[plan];

      // Update subscription record
      await supabase.from("subscriptions").upsert({
        id: sub.id,
        organization_id: orgId,
        status: sub.status,
        price_id: priceId,
        cancel_at_period_end: sub.cancel_at_period_end,
        cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
        canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Update organization plan
      await supabase.from("hs_organizations").update({
        plan,
        plan_status: sub.status === "active" ? "active" :
          sub.status === "past_due" ? "past_due" :
          sub.status === "canceled" ? "canceled" : "active",
        stripe_subscription_id: sub.id,
        max_accounts: planConfig.maxAccounts,
        max_integrations: planConfig.maxIntegrations,
      }).eq("id", orgId);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.organization_id;
      if (!orgId) break;

      await supabase.from("hs_organizations").update({
        plan: "free",
        plan_status: "canceled",
        stripe_subscription_id: null,
        max_accounts: 50,
        max_integrations: 1,
      }).eq("id", orgId);
      break;
    }

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.organization_id;
      const customerId = session.customer as string;

      if (orgId && customerId) {
        await supabase.from("hs_organizations").update({
          stripe_customer_id: customerId,
        }).eq("id", orgId);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const sub = invoice.subscription;
      if (!sub) break;

      const { data: subRecord } = await supabase
        .from("subscriptions").select("organization_id").eq("id", sub).single();

      if (subRecord) {
        await supabase.from("hs_organizations").update({
          plan_status: "past_due",
        }).eq("id", subRecord.organization_id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
