import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).single();
  if (!profile?.organization_id) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { data: formula, error } = await supabase
    .from("hs_health_score_formulas")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .eq("is_active", true)
    .single();

  if (error && error.code === "PGRST116") {
    // No formula yet — return default
    return NextResponse.json({
      components: [
        { key: "usage", label: "Product Usage", weight: 30, enabled: true },
        { key: "support", label: "Support Health", weight: 20, enabled: true },
        { key: "billing", label: "Billing Health", weight: 20, enabled: true },
        { key: "engagement", label: "Login Frequency", weight: 15, enabled: true },
        { key: "nps", label: "NPS Score", weight: 10, enabled: true },
        { key: "feature_adoption", label: "Feature Adoption", weight: 5, enabled: true },
      ],
      thresholds: { green: 70, yellow: 40 },
    });
  }

  return NextResponse.json(formula);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).single();
  if (!profile?.organization_id) return NextResponse.json({ error: "No org" }, { status: 400 });

  const body = await request.json();
  const { components, thresholds, name } = body;

  // Validate weights sum to 100
  const enabledComponents = components.filter((c: { enabled: boolean }) => c.enabled);
  const totalWeight = enabledComponents.reduce((sum: number, c: { weight: number }) => sum + c.weight, 0);
  if (Math.abs(totalWeight - 100) > 1) {
    return NextResponse.json(
      { error: `Component weights must sum to 100 (current: ${totalWeight})` },
      { status: 400 }
    );
  }

  // Deactivate existing formula and create new version
  const { data: existing } = await supabase
    .from("hs_health_score_formulas")
    .select("version")
    .eq("organization_id", profile.organization_id)
    .eq("is_active", true)
    .single();

  if (existing) {
    await supabase
      .from("hs_health_score_formulas")
      .update({ is_active: false })
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true);
  }

  const { data: formula, error } = await supabase
    .from("hs_health_score_formulas")
    .insert({
      organization_id: profile.organization_id,
      name: name || "Custom Formula",
      components,
      thresholds: thresholds || { green: 70, yellow: 40 },
      is_active: true,
      version: (existing?.version || 0) + 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(formula);
}
