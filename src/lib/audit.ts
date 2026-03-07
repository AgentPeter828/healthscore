import { createServiceClient } from "@/lib/supabase/server";

export type AuditAction =
  | "formula.updated"
  | "playbook.created"
  | "playbook.updated"
  | "playbook.deleted"
  | "integration.connected"
  | "integration.disconnected"
  | "account.created"
  | "account.deleted"
  | "account.exported"
  | "account.deletion_requested";

export async function logAudit(
  orgId: string,
  userId: string,
  action: AuditAction,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = await createServiceClient();
    await supabase.from("hs_audit_log").insert({
      organization_id: orgId,
      user_id: userId,
      action,
      details,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Don't let audit logging failures break the main flow
    console.error("Audit log error:", err);
  }
}
