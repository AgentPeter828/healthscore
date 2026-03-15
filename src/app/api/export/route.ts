import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitExport } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

const VALID_FORMATS = ["csv", "json", "xlsx"];

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

  // Build query with filters
  let query = supabase
    .from("hs_accounts")
    .select("*, health_score:hs_health_scores(overall_score, churn_risk_label)")
    .eq("organization_id", orgId);

  if (filters.status) {
    query = query.eq("segment", filters.status === "at_risk" ? "red" : filters.status);
  }
  if (filters.segment) {
    query = query.eq("segment", filters.segment);
  }

  const { data: accounts } = await query;
  const rows = (accounts || []).map((a: Record<string, unknown>) => {
    const hs = Array.isArray(a.health_score) ? a.health_score[0] : a.health_score;
    return {
      "Account Name": a.name ?? "",
      "Domain": a.domain ?? "",
      "Health Score": (hs as Record<string, unknown>)?.overall_score ?? "",
      "Segment": a.segment ?? "",
      "Status": a.status ?? "",
      "MRR": a.mrr ?? 0,
      "Churn Risk": (hs as Record<string, unknown>)?.churn_risk_label ?? "",
      "Renewal Date": a.renewal_date ?? "",
      "Last Activity": a.updated_at ?? "",
    };
  });

  const dateStr = new Date().toISOString().split("T")[0];

  if (format === "xlsx") {
    try {
      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Set column widths
      worksheet["!cols"] = [
        { wch: 25 }, // Account Name
        { wch: 20 }, // Domain
        { wch: 12 }, // Health Score
        { wch: 10 }, // Segment
        { wch: 10 }, // Status
        { wch: 12 }, // MRR
        { wch: 12 }, // Churn Risk
        { wch: 14 }, // Renewal Date
        { wch: 20 }, // Last Activity
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Accounts");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="healthscore-export-${dateStr}.xlsx"`,
        },
      });
    } catch (err) {
      console.error("XLSX export error:", err);
      return NextResponse.json({ error: "XLSX export failed" }, { status: 500 });
    }
  }

  if (format === "csv") {
    if (rows.length === 0) {
      return new NextResponse("Account Name,Domain,Health Score,Segment,Status,MRR,Churn Risk,Renewal Date,Last Activity\n", {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="healthscore-export-${dateStr}.csv"`,
        },
      });
    }
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(","),
      ...rows.map((r: Record<string, unknown>) =>
        headers.map((h) => JSON.stringify(String(r[h] ?? ""))).join(",")
      ),
    ];
    return new NextResponse(csvLines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="healthscore-export-${dateStr}.csv"`,
      },
    });
  }

  return NextResponse.json(rows);
}
