// Usage Tracker — Track resource usage per organization
import { createClient } from "@/lib/supabase/server";

const isMock = process.env.NEXT_PUBLIC_MOCK_DATA === "true";

export interface UsageStats {
  accounts: number;
  integrations: number;
  users: number;
  playbooks: number;
}

const MOCK_USAGE: UsageStats = {
  accounts: 12,
  integrations: 2,
  users: 1,
  playbooks: 3,
};

export async function getUsageStats(orgId: string): Promise<UsageStats> {
  if (isMock) return MOCK_USAGE;

  const supabase = await createClient();

  const [accountsRes, integrationsRes, usersRes, playbooksRes] = await Promise.all([
    supabase
      .from("hs_accounts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "active"),
    supabase
      .from("hs_integrations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("is_active", true),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabase
      .from("hs_playbooks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
  ]);

  return {
    accounts: accountsRes.count ?? 0,
    integrations: integrationsRes.count ?? 0,
    users: usersRes.count ?? 0,
    playbooks: playbooksRes.count ?? 0,
  };
}
