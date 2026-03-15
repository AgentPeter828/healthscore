import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).single();
  if (!profile?.organization_id) return NextResponse.json({ error: "No org" }, { status: 400 });

  const searchParams = request.nextUrl.searchParams;
  const segment = searchParams.get("segment");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("hs_accounts")
    .select(`
      *,
      health_score:hs_health_scores(
        overall_score, churn_risk, churn_risk_label,
        usage_score, support_score, billing_score,
        engagement_score, nps_score, feature_adoption_score
      ),
      csm:profiles(id, full_name, email)
    `, { count: "exact" })
    .eq("organization_id", profile.organization_id)
    .order("mrr", { ascending: false })
    .range(offset, offset + limit - 1);

  if (segment) query = query.eq("segment", segment);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data: accounts, count, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ accounts, total: count });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, organization:hs_organizations(max_accounts)")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) return NextResponse.json({ error: "No org" }, { status: 400 });

  // Check account limits
  const org = Array.isArray(profile.organization) ? profile.organization[0] : profile.organization;
  const maxAccounts = (org as { max_accounts?: number })?.max_accounts ?? 50;

  if (maxAccounts !== -1) {
    const { count } = await supabase
      .from("hs_accounts")
      .select("id", { count: "exact" })
      .eq("organization_id", profile.organization_id)
      .eq("status", "active");

    if ((count || 0) >= maxAccounts) {
      return NextResponse.json(
        { error: `Your plan allows ${maxAccounts} accounts. Upgrade to add more.` },
        { status: 403 }
      );
    }
  }

  const body = await request.json();

  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    return NextResponse.json({ error: "Account name is required" }, { status: 400 });
  }

  // Sanitize name to prevent XSS
  body.name = body.name.replace(/[<>]/g, "");

  const { data: account, error } = await supabase
    .from("hs_accounts")
    .insert({
      ...body,
      organization_id: profile.organization_id,
      arr: body.mrr ? body.mrr * 12 : 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create initial health score record
  await supabase.from("hs_health_scores").insert({
    organization_id: profile.organization_id,
    account_id: account.id,
    overall_score: 50,
    usage_score: 50,
    support_score: 75,
    billing_score: 80,
    engagement_score: 50,
    nps_score: 50,
    feature_adoption_score: 50,
    churn_risk: 0.3,
    churn_risk_label: "medium",
  });

  await logAudit(profile.organization_id, user.id, "account.created", {
    account_id: account.id,
    name: account.name,
  });

  return NextResponse.json(account);
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
    .from("hs_accounts")
    .update({ ...updates, arr: updates.mrr ? updates.mrr * 12 : undefined })
    .eq("id", id)
    .eq("organization_id", profile?.organization_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
