import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Playbook, PlaybookAction, ActionType, PlaybookTrigger } from "@/lib/types";
import { PlaybookBuilder } from "@/components/dashboard/playbooks/playbook-builder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Play,
  Clock,
  ChevronRight,
  ToggleLeft,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";

export const metadata = { title: "Playbooks" };

function getTriggerLabel(trigger_type: PlaybookTrigger, trigger_config: Record<string, unknown>): string {
  switch (trigger_type) {
    case "score_threshold":
      return `When score drops below ${trigger_config.threshold ?? "—"}`;
    case "score_drop":
      return `Score drops by ${trigger_config.points ?? "—"} pts in ${trigger_config.days ?? "—"} days`;
    case "churn_risk":
      return `Churn risk exceeds ${trigger_config.level ?? "—"}`;
    case "renewal_upcoming":
      return `Renewal within ${trigger_config.days ?? "—"} days`;
    case "segment_change":
      return `Account moves to ${trigger_config.segment ?? "—"} segment`;
    case "manual":
      return "Manually triggered";
    default:
      return "Unknown trigger";
  }
}

function getActionLabel(action_type: ActionType): string {
  switch (action_type) {
    case "slack_alert":
      return "Slack alert";
    case "email":
      return "Email";
    case "hubspot_sequence":
      return "HubSpot sequence";
    case "webhook":
      return "Webhook";
    case "update_segment":
      return "Update segment";
    case "create_task":
      return "Create task";
    default:
      return action_type;
  }
}

function getActionFlow(actions: PlaybookAction[]): string {
  if (!actions || actions.length === 0) return "No actions";
  const sorted = [...actions].sort((a, b) => a.sort_order - b.sort_order);
  const labels = sorted.map((a) => getActionLabel(a.action_type));
  return `${labels.length} action${labels.length !== 1 ? "s" : ""}: ${labels.join(" → ")}`;
}

export default async function PlaybooksPage() {
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

  const { data: playbooks } = await supabase
    .from("hs_playbooks")
    .select("*, actions:hs_playbook_actions(*)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  const typedPlaybooks = (playbooks ?? []) as (Playbook & { actions: PlaybookAction[] })[];

  const totalPlaybooks = typedPlaybooks.length;
  const activePlaybooks = typedPlaybooks.filter((p) => p.is_active).length;
  const totalRuns = typedPlaybooks.reduce((sum, p) => sum + (p.run_count ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Playbooks</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Automate actions based on customer health signals
          </p>
        </div>
        <PlaybookBuilder mode="create" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">Total Playbooks</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{totalPlaybooks}</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">Active</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{activePlaybooks}</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <Play className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">Total Runs</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{totalRuns}</div>
        </div>
      </div>

      {/* Playbook List */}
      {typedPlaybooks.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-16 text-center">
          <Zap className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No playbooks yet</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Create your first playbook to automatically respond to customer health signals — like
            sending a Slack alert when a score drops.
          </p>
          <PlaybookBuilder mode="create" />
        </div>
      ) : (
        <div className="space-y-3">
          {typedPlaybooks.map((playbook) => (
            <PlaybookCard key={playbook.id} playbook={playbook} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlaybookCard({
  playbook,
}: {
  playbook: Playbook & { actions: PlaybookAction[] };
}) {
  const actions = playbook.actions ?? [];

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            playbook.is_active
              ? "bg-blue-100 text-blue-600"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          <Zap className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-foreground">{playbook.name}</h3>
            <Badge
              variant="outline"
              className={
                playbook.is_active
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }
            >
              {playbook.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          {playbook.description && (
            <p className="text-sm text-muted-foreground mb-2">{playbook.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {/* Trigger */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
              <span>{getTriggerLabel(playbook.trigger_type, playbook.trigger_config)}</span>
            </div>

            {/* Actions flow */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
              <span>{getActionFlow(actions)}</span>
            </div>
          </div>

          {/* Runs + last run */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Play className="w-3 h-3" />
              {playbook.run_count ?? 0} runs
            </span>
            {playbook.last_run_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last run {formatDate(playbook.last_run_at)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <PlaybookBuilder mode="edit" playbook={playbook as Playbook} />
          <form action={`/api/playbooks/${playbook.id}`} method="POST">
            <input type="hidden" name="_method" value="DELETE" />
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              type="submit"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
