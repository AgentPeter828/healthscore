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
  const unread = searchParams.get("unread");
  const severity = searchParams.get("severity");

  let query = supabase
    .from("hs_alerts")
    .select("*, account:hs_accounts(id, name, segment)")
    .eq("organization_id", profile.organization_id)
    .eq("is_resolved", false)
    .order("created_at", { ascending: false })
    .limit(100);

  if (unread === "true") query = query.eq("is_read", false);
  if (severity) query = query.eq("severity", severity);

  const { data: alerts } = await query;
  return NextResponse.json(alerts || []);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).single();

  const body = await request.json();
  const { ids, action } = body; // action: "read" | "resolve" | "read_all"

  if (action === "read_all") {
    await supabase
      .from("hs_alerts")
      .update({ is_read: true })
      .eq("organization_id", profile?.organization_id)
      .eq("is_read", false);
  } else if (ids?.length) {
    const updates =
      action === "read"
        ? { is_read: true }
        : { is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: user.id };

    await supabase
      .from("hs_alerts")
      .update(updates)
      .in("id", ids)
      .eq("organization_id", profile?.organization_id);
  }

  return NextResponse.json({ success: true });
}
