import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitExport } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  // Rate limit: 1 per hour
  const rl = rateLimitExport(request);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Export rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const orgId = profile.organization_id;

  // Fetch all org data in parallel
  const [accounts, scores, contacts, notes, alerts] = await Promise.all([
    supabase.from("hs_accounts").select("*").eq("organization_id", orgId),
    supabase.from("hs_health_scores").select("*").eq("organization_id", orgId),
    supabase.from("hs_contacts").select("*").eq("organization_id", orgId),
    supabase.from("hs_notes").select("*").eq("organization_id", orgId),
    supabase.from("hs_alerts").select("*").eq("organization_id", orgId),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    organization_id: orgId,
    accounts: accounts.data ?? [],
    health_scores: scores.data ?? [],
    contacts: contacts.data ?? [],
    notes: notes.data ?? [],
    alerts: alerts.data ?? [],
  };

  await logAudit(orgId, user.id, "account.exported", {});

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="healthscore-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
