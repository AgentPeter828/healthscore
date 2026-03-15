import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { slugify } from "@/lib/utils";
import { sendWelcomeEmail } from "@/lib/email/resend";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create or link organization for new users
      const serviceClient = await createServiceClient();

      // Check if profile already has an org
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("organization_id, email, full_name")
        .eq("id", data.user.id)
        .single();

      if (profile && !profile.organization_id) {
        // Create a new organization for this user
        const orgName =
          data.user.user_metadata?.org_name ||
          `${profile.full_name || profile.email}'s Team`;

        const slug = slugify(orgName) + "-" + Math.random().toString(36).slice(2, 7);

        const { data: org } = await serviceClient
          .from("hs_organizations")
          .insert({
            name: orgName,
            slug,
            plan: "free",
            max_accounts: 50,
            max_integrations: 1,
          })
          .select()
          .single();

        if (org) {
          // Link user to org as owner
          await serviceClient
            .from("profiles")
            .update({
              organization_id: org.id,
              role: "owner",
            })
            .eq("id", data.user.id);

          // Create default formula
          await serviceClient.from("hs_health_score_formulas").insert({
            organization_id: org.id,
            name: "Default Formula",
            is_active: true,
          });

          // Send welcome email (best-effort, don't block)
          if (profile.email) {
            sendWelcomeEmail(
              profile.email,
              profile.full_name || profile.email,
              orgName
            ).catch(() => {});
          }

          // Create default segments
          await serviceClient.from("hs_segments").insert([
            {
              organization_id: org.id,
              name: "Healthy",
              color: "green",
              hex_color: "#22c55e",
              min_score: 70,
              max_score: 100,
              is_system: true,
            },
            {
              organization_id: org.id,
              name: "At Risk",
              color: "yellow",
              hex_color: "#eab308",
              min_score: 40,
              max_score: 69,
              is_system: true,
            },
            {
              organization_id: org.id,
              name: "Critical",
              color: "red",
              hex_color: "#ef4444",
              min_score: 0,
              max_score: 39,
              is_system: true,
            },
          ]);
        }
      }

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
