import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Integration, IntegrationType } from "@/lib/types";
import { IntegrationCard } from "@/components/dashboard/integrations/integration-card";
import { Plug } from "lucide-react";

export const metadata = { title: "Integrations" };

// ─── Integration catalogue ────────────────────────────────────

interface IntegrationDef {
  type: IntegrationType;
  name: string;
  category: string;
  description: string;
  planRequired?: string;
  setupSteps: { title: string; description: string }[];
}

const INTEGRATIONS: IntegrationDef[] = [
  // Billing
  {
    type: "stripe",
    name: "Stripe",
    category: "Billing",
    description: "Track MRR, payment failures, plan changes, and subscription events.",
    setupSteps: [
      { title: "Click Connect", description: "Click the Connect button to generate your webhook URL." },
      { title: "Copy the webhook URL", description: "Copy the generated webhook URL from below." },
      {
        title: "Paste into Stripe Dashboard",
        description:
          "Go to Stripe Dashboard → Developers → Webhooks → Add endpoint. Paste the URL and select events: customer.subscription.*, invoice.payment_failed, charge.refunded.",
      },
      { title: "Send a test event", description: "Click 'Send test webhook' in Stripe to verify the connection." },
    ],
  },

  // Support
  {
    type: "intercom",
    name: "Intercom",
    category: "Support",
    description: "Ticket volume, open tickets, CSAT scores, and conversation data.",
    setupSteps: [
      { title: "Click Connect", description: "Generate your unique webhook URL." },
      { title: "Copy the webhook URL", description: "Copy the URL shown below." },
      {
        title: "Paste into Intercom",
        description:
          "Go to Intercom → Settings → Integrations → Webhooks. Add a new webhook with your URL. Subscribe to: conversation.created, conversation.closed, conversation.rated.",
      },
      { title: "Send a test event", description: "Trigger a conversation action in Intercom to test the connection." },
    ],
  },
  {
    type: "helpscout",
    name: "Help Scout",
    category: "Support",
    description: "Conversations, satisfaction scores, and response times.",
    setupSteps: [
      { title: "Click Connect", description: "Generate your unique webhook URL." },
      { title: "Copy the webhook URL", description: "Copy the URL shown below." },
      {
        title: "Paste into Help Scout",
        description:
          "Go to Help Scout → Your Profile → Authentication → API Keys. Then navigate to Settings → Webhooks and add a new webhook pointing to your URL.",
      },
      { title: "Send a test event", description: "Create a test conversation in Help Scout to verify the connection." },
    ],
  },
  {
    type: "zendesk",
    name: "Zendesk",
    category: "Support",
    description: "Ticket volume, resolution time, CSAT scores, and support trends.",
    setupSteps: [
      { title: "Click Connect", description: "Generate your unique webhook URL." },
      { title: "Copy the webhook URL", description: "Copy the URL shown below." },
      {
        title: "Paste into Zendesk",
        description:
          "Go to Zendesk Admin → Apps and Integrations → Webhooks → Create webhook. Paste your URL. Then create a trigger that fires the webhook on ticket updates.",
      },
      { title: "Send a test event", description: "Use Zendesk's webhook test feature or create a test ticket." },
    ],
  },

  // Product Analytics
  {
    type: "segment",
    name: "Segment",
    category: "Product Analytics",
    description: "User events, feature usage, DAU/MAU, and behavioral data.",
    setupSteps: [
      { title: "Click Connect", description: "Generate your unique webhook URL." },
      { title: "Copy the webhook URL", description: "Copy the URL shown below." },
      {
        title: "Paste into Segment",
        description:
          "Go to Segment → Connections → Destinations → Add Destination → Webhooks (Actions). Configure the destination to forward track and identify calls to your URL.",
      },
      { title: "Send a test event", description: "Use Segment's Event Debugger to send a test track event." },
    ],
  },
  {
    type: "mixpanel",
    name: "Mixpanel",
    category: "Product Analytics",
    description: "Event tracking, funnel analysis, and cohort retention data.",
    setupSteps: [
      { title: "Click Connect", description: "Generate your unique webhook URL." },
      { title: "Copy the webhook URL", description: "Copy the URL shown below." },
      {
        title: "Configure Mixpanel Export",
        description:
          "In Mixpanel, go to Project Settings → Data Pipelines or use the Mixpanel Export API to forward events. Add your webhook URL as the destination.",
      },
      { title: "Send a test event", description: "Trigger a test event export from Mixpanel." },
    ],
  },
  {
    type: "amplitude",
    name: "Amplitude",
    category: "Product Analytics",
    description: "Behavioral analytics, retention analysis, and product insights.",
    setupSteps: [
      { title: "Click Connect", description: "Generate your unique webhook URL." },
      { title: "Copy the webhook URL", description: "Copy the URL shown below." },
      {
        title: "Configure Amplitude Destination",
        description:
          "In Amplitude, go to Data → Destinations → Add Destination → Webhook. Paste your URL and configure event forwarding.",
      },
      { title: "Send a test event", description: "Use Amplitude's test event feature to verify the connection." },
    ],
  },

  // CRM
  {
    type: "hubspot",
    name: "HubSpot",
    category: "CRM",
    description: "Contact sync, deal tracking, and sequence enrollment for at-risk accounts.",
    planRequired: "Growth+ plan required",
    setupSteps: [
      { title: "Click Connect", description: "Generate your unique webhook URL (requires Growth plan or higher)." },
      { title: "Copy the webhook URL", description: "Copy the URL shown below." },
      {
        title: "Paste into HubSpot",
        description:
          "Go to HubSpot → Settings → Integrations → Private Apps or Webhooks. Create a new webhook subscription pointing to your URL for contact and deal events.",
      },
      { title: "Send a test event", description: "Update a contact in HubSpot to trigger a test webhook event." },
    ],
  },
];

const CATEGORIES = ["Billing", "Support", "Product Analytics", "CRM"];

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) redirect("/dashboard/onboarding");
  const orgId = profile.organization_id;

  const { data: integrations } = await supabase
    .from("hs_integrations")
    .select("*")
    .eq("organization_id", orgId);

  const integrationMap = new Map<IntegrationType, Integration>();
  for (const integration of integrations ?? []) {
    integrationMap.set(integration.type as IntegrationType, integration as Integration);
  }

  const connectedCount = integrationMap.size;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Connect your tools to power health scores with real data
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">{connectedCount}</div>
          <div className="text-xs text-muted-foreground">connected</div>
        </div>
      </div>

      {/* Empty state hint */}
      {connectedCount === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Plug className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">No integrations connected yet</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Connect at least one integration so HealthScore can start calculating health signals for
              your accounts.
            </p>
          </div>
        </div>
      )}

      {/* Category sections */}
      {CATEGORIES.map((category) => {
        const defs = INTEGRATIONS.filter((i) => i.category === category);
        return (
          <div key={category}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {defs.map((def) => (
                <IntegrationCard
                  key={def.type}
                  type={def.type}
                  name={def.name}
                  category={def.category}
                  description={def.description}
                  setupSteps={def.setupSteps}
                  planRequired={def.planRequired}
                  integration={integrationMap.get(def.type) ?? null}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
