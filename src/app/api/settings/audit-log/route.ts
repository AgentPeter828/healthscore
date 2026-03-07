import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ error: "No org" }, { status: 400 });
  }

  const { data: entries } = await supabase
    .from("hs_audit_log")
    .select("id, action, details, created_at, user:profiles!hs_audit_log_user_id_fkey(full_name, email)")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ entries: entries ?? [] });
}
