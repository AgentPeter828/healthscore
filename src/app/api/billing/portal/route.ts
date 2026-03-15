import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCustomerPortalSession } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, organization:hs_organizations(stripe_customer_id)")
    .eq("id", user.id)
    .single();

  const org = Array.isArray(profile?.organization) ? profile?.organization[0] : profile?.organization;
  const customerId = (org as { stripe_customer_id?: string })?.stripe_customer_id;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Mock mode: return a mock portal URL
  if (process.env.NEXT_PUBLIC_MOCK_DATA === "true" || !customerId) {
    return NextResponse.json({
      url: `${appUrl}/dashboard/settings/billing?portal=true`,
    });
  }

  const session = await createCustomerPortalSession({
    customerId,
    returnUrl: `${appUrl}/dashboard/settings`,
  });

  return NextResponse.json({ url: session.url });
}
