import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).single();
  if (!profile?.organization_id) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { data: integrations } = await supabase
    .from("hs_integrations")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: true });

  return NextResponse.json(integrations || []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, organization:hs_organizations(plan, max_integrations)")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) return NextResponse.json({ error: "No org" }, { status: 400 });

  const body = await request.json();
  const { type, name, config } = body;

  // Check plan limits
  const org = Array.isArray(profile.organization) ? profile.organization[0] : profile.organization;
  const maxIntegrations = (org as { max_integrations?: number })?.max_integrations ?? 1;

  if (maxIntegrations !== -1) {
    const { count } = await supabase
      .from("hs_integrations")
      .select("id", { count: "exact" })
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true);

    if ((count || 0) >= maxIntegrations) {
      return NextResponse.json(
        { error: `Your plan allows ${maxIntegrations} integration(s). Upgrade to add more.` },
        { status: 403 }
      );
    }
  }

  const { data: integration, error } = await supabase
    .from("hs_integrations")
    .upsert({
      organization_id: profile.organization_id,
      type,
      name: name || type,
      config: config || {},
      is_active: true,
    }, { onConflict: "organization_id,type" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(profile.organization_id, user.id, "integration.connected", {
    integration_id: integration?.id,
    type,
  });

  return NextResponse.json(integration);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();

  const { data: profile } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).single();

  await supabase
    .from("hs_integrations")
    .update({ is_active: false })
    .eq("id", id)
    .eq("organization_id", profile?.organization_id);

  if (profile?.organization_id) {
    await logAudit(profile.organization_id, user.id, "integration.disconnected", {
      integration_id: id,
    });
  }

  return NextResponse.json({ success: true });
}
