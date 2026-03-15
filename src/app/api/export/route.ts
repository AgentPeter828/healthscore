import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitExport } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

const VALID_FORMATS = ["csv", "json"];

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

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).single();
  if (!profile?.organization_id) return NextResponse.json({ error: "No organization" }, { status: 400 });

  let body: { format?: string; filters?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { format = "csv", filters = {} } = body;

  if (!VALID_FORMATS.includes(format)) {
    return NextResponse.json({ error: `Invalid format. Supported: ${VALID_FORMATS.join(", ")}` }, { status: 400 });
  }

  const orgId = profile.organization_id;

  let query = supabase
    .from("hs_accounts")
    .select("*")
    .eq("organization_id", orgId);

  if (filters.status) {
    query = query.eq("segment", filters.status === "at_risk" ? "red" : filters.status);
  }

  const { data: accounts } = await query;
  const rows = accounts || [];

  if (format === "csv") {
    if (rows.length === 0) {
      return new NextResponse("id,name,domain,segment,mrr,status\n", {
        status: 200,
        headers: { "Content-Type": "text/csv" },
      });
    }
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(","),
      ...rows.map(r => headers.map(h => JSON.stringify(String(r[h] ?? ""))).join(",")),
    ];
    return new NextResponse(csvLines.join("\n"), {
      status: 200,
      headers: { "Content-Type": "text/csv" },
    });
  }

  return NextResponse.json(rows);
}
