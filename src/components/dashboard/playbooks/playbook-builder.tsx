"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Pencil, GripVertical } from "lucide-react";
import {
  Playbook,
  PlaybookTrigger,
  ActionType,
  PlaybookCondition,
} from "@/lib/types";

// ─── Local types ──────────────────────────────────────────────

interface ActionRow {
  id: string;
  action_type: ActionType;
  config: Record<string, string>;
}

interface ConditionRow {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface PlaybookBuilderProps {
  mode: "create" | "edit";
  playbook?: Playbook;
}

// ─── Trigger config fields ────────────────────────────────────

function TriggerConfig({
  type,
  value,
  onChange,
}: {
  type: PlaybookTrigger;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const set = (key: string, val: string) => onChange({ ...value, [key]: val });

  switch (type) {
    case "score_threshold":
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Score drops below</span>
          <Input
            type="number"
            min={0}
            max={100}
            placeholder="50"
            className="w-20"
            value={value.threshold ?? ""}
            onChange={(e) => set("threshold", e.target.value)}
          />
        </div>
      );
    case "score_drop":
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Score drops by</span>
          <Input
            type="number"
            min={1}
            placeholder="10"
            className="w-20"
            value={value.points ?? ""}
            onChange={(e) => set("points", e.target.value)}
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">points in</span>
          <Input
            type="number"
            min={1}
            placeholder="7"
            className="w-20"
            value={value.days ?? ""}
            onChange={(e) => set("days", e.target.value)}
          />
          <span className="text-sm text-muted-foreground">days</span>
        </div>
      );
    case "churn_risk":
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Churn risk exceeds</span>
          <Select value={value.level ?? ""} onValueChange={(v) => set("level", v)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    case "renewal_upcoming":
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Renewal within</span>
          <Input
            type="number"
            min={1}
            placeholder="30"
            className="w-20"
            value={value.days ?? ""}
            onChange={(e) => set("days", e.target.value)}
          />
          <span className="text-sm text-muted-foreground">days</span>
        </div>
      );
    case "segment_change":
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Account moves to</span>
          <Select value={value.segment ?? ""} onValueChange={(v) => set("segment", v)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="yellow">Yellow</SelectItem>
              <SelectItem value="red">Red</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    case "manual":
      return (
        <p className="text-sm text-muted-foreground">
          This playbook runs when triggered manually from an account.
        </p>
      );
    default:
      return null;
  }
}

// ─── Action config fields ─────────────────────────────────────

function ActionConfig({
  type,
  config,
  onChange,
}: {
  type: ActionType;
  config: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const set = (key: string, val: string) => onChange({ ...config, [key]: val });

  switch (type) {
    case "slack_alert":
      return (
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Channel</Label>
            <Input
              placeholder="#customer-alerts"
              value={config.channel ?? ""}
              onChange={(e) => set("channel", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Message</Label>
            <Textarea
              placeholder="Account {{account_name}} health score dropped to {{score}}"
              rows={2}
              value={config.message ?? ""}
              onChange={(e) => set("message", e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use {"{{account_name}}"}, {"{{score}}"} as template variables
            </p>
          </div>
        </div>
      );
    case "email":
      return (
        <div className="space-y-2">
          <div>
            <Label className="text-xs">To</Label>
            <Input
              type="email"
              placeholder="csm@yourcompany.com"
              value={config.to ?? ""}
              onChange={(e) => set("to", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Subject</Label>
            <Input
              placeholder="Action needed: {{account_name}}"
              value={config.subject ?? ""}
              onChange={(e) => set("subject", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Body</Label>
            <Textarea
              placeholder="The health score for {{account_name}} has dropped to {{score}}..."
              rows={3}
              value={config.body ?? ""}
              onChange={(e) => set("body", e.target.value)}
            />
          </div>
        </div>
      );
    case "hubspot_sequence":
      return (
        <div>
          <Label className="text-xs">Sequence ID</Label>
          <Input
            placeholder="HubSpot sequence ID"
            value={config.sequence_id ?? ""}
            onChange={(e) => set("sequence_id", e.target.value)}
          />
        </div>
      );
    case "webhook":
      return (
        <div className="space-y-2">
          <div>
            <Label className="text-xs">URL</Label>
            <Input
              type="url"
              placeholder="https://hooks.example.com/..."
              value={config.url ?? ""}
              onChange={(e) => set("url", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Method</Label>
            <Select value={config.method ?? "POST"} onValueChange={(v) => set("method", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    case "update_segment":
      return (
        <div>
          <Label className="text-xs">New Segment</Label>
          <Select
            value={config.new_segment ?? ""}
            onValueChange={(v) => set("new_segment", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select segment..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="yellow">Yellow</SelectItem>
              <SelectItem value="red">Red</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    default:
      return null;
  }
}

// ─── Main component ───────────────────────────────────────────

export function PlaybookBuilder({ mode, playbook }: PlaybookBuilderProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<PlaybookTrigger>("score_threshold");
  const [triggerConfig, setTriggerConfig] = useState<Record<string, string>>({});
  const [conditions, setConditions] = useState<ConditionRow[]>([]);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Populate when editing
  useEffect(() => {
    if (open && playbook) {
      setName(playbook.name ?? "");
      setDescription(playbook.description ?? "");
      setTriggerType(playbook.trigger_type);
      setTriggerConfig(
        (playbook.trigger_config as Record<string, string>) ?? {}
      );
      setConditions(
        (playbook.conditions ?? []).map((c: PlaybookCondition, i: number) => ({
          id: String(i),
          field: c.field,
          operator: c.operator,
          value: String(c.value),
        }))
      );
      setActions(
        (playbook.actions ?? []).map((a, i: number) => ({
          id: String(i),
          action_type: a.action_type,
          config: (a.config as Record<string, string>) ?? {},
        }))
      );
      setIsActive(playbook.is_active ?? true);
    } else if (open && mode === "create") {
      setName("");
      setDescription("");
      setTriggerType("score_threshold");
      setTriggerConfig({});
      setConditions([]);
      setActions([]);
      setIsActive(true);
    }
  }, [open, playbook, mode]);

  // Condition helpers
  const addCondition = () => {
    setConditions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), field: "mrr", operator: ">", value: "" },
    ]);
  };
  const updateCondition = (id: string, key: keyof ConditionRow, val: string) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [key]: val } : c))
    );
  };
  const removeCondition = (id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id));
  };

  // Action helpers
  const addAction = () => {
    setActions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), action_type: "slack_alert", config: {} },
    ]);
  };
  const updateActionType = (id: string, type: ActionType) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, action_type: type, config: {} } : a))
    );
  };
  const updateActionConfig = (id: string, config: Record<string, string>) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, config } : a))
    );
  };
  const removeAction = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        trigger_type: triggerType,
        trigger_config: triggerConfig,
        conditions: conditions.map(({ field, operator, value }) => ({
          field,
          operator,
          value,
        })),
        actions: actions.map(({ action_type, config }, i) => ({
          action_type,
          config,
          sort_order: i,
        })),
        is_active: isActive,
      };

      const url = mode === "edit" && playbook ? `/api/playbooks/${playbook.id}` : "/api/playbooks";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setOpen(false);
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            Create Playbook
          </Button>
        ) : (
          <Button variant="ghost" size="sm">
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Playbook" : "Edit Playbook"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              placeholder="e.g. Alert on critical score drop"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              placeholder="What does this playbook do?"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Separator />

          {/* Trigger type */}
          <div className="space-y-3">
            <Label>Trigger</Label>
            <Select
              value={triggerType}
              onValueChange={(v) => {
                setTriggerType(v as PlaybookTrigger);
                setTriggerConfig({});
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score_threshold">Score Threshold</SelectItem>
                <SelectItem value="score_drop">Score Drop</SelectItem>
                <SelectItem value="churn_risk">Churn Risk</SelectItem>
                <SelectItem value="renewal_upcoming">Renewal Upcoming</SelectItem>
                <SelectItem value="segment_change">Segment Change</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>

            {/* Dynamic trigger config */}
            <div className="pl-1">
              <TriggerConfig
                type={triggerType}
                value={triggerConfig}
                onChange={setTriggerConfig}
              />
            </div>
          </div>

          <Separator />

          {/* Conditions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Conditions</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Optional filters that must match for the playbook to run
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addCondition} className="gap-1">
                <Plus className="w-3.5 h-3.5" />
                Add Condition
              </Button>
            </div>

            {conditions.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No conditions — runs for all accounts</p>
            )}

            <div className="space-y-2">
              {conditions.map((cond) => (
                <div key={cond.id} className="flex items-center gap-2">
                  <Select
                    value={cond.field}
                    onValueChange={(v) => updateCondition(cond.id, "field", v)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mrr">MRR</SelectItem>
                      <SelectItem value="arr">ARR</SelectItem>
                      <SelectItem value="seats">Seats</SelectItem>
                      <SelectItem value="segment">Segment</SelectItem>
                      <SelectItem value="plan">Plan</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={cond.operator}
                    onValueChange={(v) => updateCondition(cond.id, "operator", v)}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=">">{">"}</SelectItem>
                      <SelectItem value="<">{"<"}</SelectItem>
                      <SelectItem value=">=">{">="}</SelectItem>
                      <SelectItem value="<=">{"<="}</SelectItem>
                      <SelectItem value="==">{"=="}</SelectItem>
                      <SelectItem value="!=">{"!="}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    className="flex-1"
                    placeholder="Value"
                    value={cond.value}
                    onChange={(e) => updateCondition(cond.id, "value", e.target.value)}
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(cond.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Actions</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  What to do when the trigger fires (in order)
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addAction} className="gap-1">
                <Plus className="w-3.5 h-3.5" />
                Add Action
              </Button>
            </div>

            {actions.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No actions added yet</p>
            )}

            <div className="space-y-4">
              {actions.map((action, idx) => (
                <div key={action.id} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Step {idx + 1}
                    </span>
                    <div className="flex-1">
                      <Select
                        value={action.action_type}
                        onValueChange={(v) => updateActionType(action.id, v as ActionType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slack_alert">Slack Alert</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="hubspot_sequence">HubSpot Sequence</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                          <SelectItem value="update_segment">Update Segment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(action.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="pl-6">
                    <ActionConfig
                      type={action.action_type}
                      config={action.config}
                      onChange={(config) => updateActionConfig(action.id, config)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Active</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enable this playbook to run automatically
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* Save */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || !name.trim()}>
              {loading ? "Saving..." : mode === "create" ? "Create Playbook" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
