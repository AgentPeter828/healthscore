import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).single();
  if (!profile?.organization_id) return NextResponse.json({ error: "No org" }, { status: 400 });

  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from") || new Date().toISOString().split("T")[0];
  const to = searchParams.get("to") || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: renewals } = await supabase
    .from("hs_renewals")
    .select(`
      *,
      account:hs_accounts(id, name, mrr, segment, health_score:hs_health_scores(overall_score, churn_risk_label)),
      owner:profiles(id, full_name, email)
    `)
    .eq("organization_id", profile.organization_id)
    .gte("renewal_date", from)
    .lte("renewal_date", to)
    .order("renewal_date", { ascending: true });

  return NextResponse.json(renewals || []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).single();
  if (!profile?.organization_id) return NextResponse.json({ error: "No org" }, { status: 400 });

  const body = await request.json();

  const { data: renewal, error } = await supabase
    .from("hs_renewals")
    .insert({ ...body, organization_id: profile.organization_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(renewal);
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).single();

  const body = await request.json();
  const { id, ...updates } = body;

  const { data, error } = await supabase
    .from("hs_renewals")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", profile?.organization_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
