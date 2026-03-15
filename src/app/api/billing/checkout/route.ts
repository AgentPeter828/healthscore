import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession, PLANS } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, organization:hs_organizations(stripe_customer_id)")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { plan } = await request.json();

  const planConfig = PLANS[plan as keyof typeof PLANS];
  if (!planConfig || plan === "free") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Mock mode: return a mock checkout URL
  if (process.env.NEXT_PUBLIC_MOCK_DATA === "true" || !planConfig.priceId) {
    return NextResponse.json({
      url: `${appUrl}/dashboard/settings/billing?success=true&session_id=mock_session_${plan}`,
    });
  }

  const org = Array.isArray(profile.organization) ? profile.organization[0] : profile.organization;
  const customerId = (org as { stripe_customer_id?: string })?.stripe_customer_id;

  const session = await createCheckoutSession({
    priceId: planConfig.priceId,
    customerId,
    organizationId: profile.organization_id,
    successUrl: `${appUrl}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appUrl}/dashboard/billing?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}
