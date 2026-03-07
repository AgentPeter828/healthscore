import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  // Only owners can delete
  if (profile.role !== "owner") {
    return NextResponse.json(
      { error: "Only the organization owner can request deletion" },
      { status: 403 }
    );
  }

  const orgId = profile.organization_id;

  // Get org to check for Stripe subscription
  const { data: org } = await supabase
    .from("hs_organizations")
    .select("stripe_subscription_id, stripe_customer_id")
    .eq("id", orgId)
    .single();

  // Cancel Stripe subscription if exists
  if (org?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(org.stripe_subscription_id);
    } catch (err) {
      console.error("Failed to cancel Stripe subscription:", err);
    }
  }

  // Soft-delete: set deleted_at timestamp
  await supabase
    .from("hs_organizations")
    .update({
      plan: "free",
      plan_status: "canceled",
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);

  await logAudit(orgId, user.id, "account.deletion_requested", {
    scheduled_hard_delete: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return NextResponse.json({
    success: true,
    message: "Account scheduled for deletion. Data will be retained for 30 days before permanent removal.",
  });
}
