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

  const { data: playbooks } = await supabase
    .from("hs_playbooks")
    .select("*, actions:hs_playbook_actions(*)")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  return NextResponse.json(playbooks || []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, organization:hs_organizations(plan)")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) return NextResponse.json({ error: "No org" }, { status: 400 });

  // Check plan (playbooks require Starter+)
  const org = Array.isArray(profile.organization) ? profile.organization[0] : profile.organization;
  const plan = (org as { plan?: string })?.plan;
  if (plan === "free") {
    return NextResponse.json(
      { error: "Playbooks require Starter plan or higher" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { name, description, trigger_type, trigger_config, conditions, actions, is_active } = body;

  // Validate required fields
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Playbook name is required" }, { status: 400 });
  }

  const VALID_TRIGGER_TYPES = ["score_threshold", "score_drop", "churn_risk", "renewal_upcoming", "segment_change", "manual"];
  if (trigger_type && !VALID_TRIGGER_TYPES.includes(trigger_type)) {
    return NextResponse.json({ error: `Invalid trigger_type. Valid: ${VALID_TRIGGER_TYPES.join(", ")}` }, { status: 400 });
  }

  // Validate trigger_config has required fields based on trigger_type
  if (trigger_config && typeof trigger_config === "object" && Object.keys(trigger_config).length === 0 && trigger_type) {
    return NextResponse.json({ error: "trigger_config cannot be empty when trigger_type is specified" }, { status: 400 });
  }

  // Create playbook
  const { data: playbook, error } = await supabase
    .from("hs_playbooks")
    .insert({
      organization_id: profile.organization_id,
      name,
      description,
      trigger_type,
      trigger_config: trigger_config || {},
      conditions: conditions || [],
      is_active: is_active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create actions
  if (actions?.length) {
    const actionInserts = actions.map((action: Record<string, unknown>, idx: number) => ({
      playbook_id: playbook.id,
      organization_id: profile.organization_id,
      action_type: action.action_type,
      config: action.config || {},
      sort_order: idx,
    }));

    await supabase.from("hs_playbook_actions").insert(actionInserts);
  }

  await logAudit(profile.organization_id, user.id, "playbook.created", {
    playbook_id: playbook.id,
    name,
  });

  return NextResponse.json(playbook);
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).single();

  const body = await request.json();
  const { id, actions, ...updates } = body;

  const { data: playbook, error } = await supabase
    .from("hs_playbooks")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", profile?.organization_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Replace actions if provided
  if (actions !== undefined) {
    await supabase.from("hs_playbook_actions").delete().eq("playbook_id", id);
    if (actions.length) {
      const actionInserts = actions.map((action: Record<string, unknown>, idx: number) => ({
        playbook_id: id,
        organization_id: profile?.organization_id,
        action_type: action.action_type,
        config: action.config || {},
        sort_order: idx,
      }));
      await supabase.from("hs_playbook_actions").insert(actionInserts);
    }
  }

  if (profile?.organization_id) {
    await logAudit(profile.organization_id, user.id, "playbook.updated", {
      playbook_id: id,
    });
  }

  return NextResponse.json(playbook);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).single();

  const { id } = await request.json();

  await supabase
    .from("hs_playbooks")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile?.organization_id);

  if (profile?.organization_id) {
    await logAudit(profile.organization_id, user.id, "playbook.deleted", {
      playbook_id: id,
    });
  }

  return NextResponse.json({ success: true });
}
