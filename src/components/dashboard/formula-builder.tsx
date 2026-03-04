"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  HeadphonesIcon,
  CreditCard,
  Users,
  Star,
  Layers,
  GripVertical,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { calculateWeightedScore } from "@/lib/utils";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface FormulaComponent {
  key: string;
  label: string;
  weight: number;
  enabled: boolean;
  description: string;
}

interface Formula {
  id?: string;
  name: string;
  components: FormulaComponent[];
  thresholds: { green: number; yellow: number };
}

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------

const COMPONENT_ICONS: Record<string, React.ReactNode> = {
  usage: <Activity className="w-4 h-4" />,
  support: <HeadphonesIcon className="w-4 h-4" />,
  billing: <CreditCard className="w-4 h-4" />,
  engagement: <Users className="w-4 h-4" />,
  nps: <Star className="w-4 h-4" />,
  feature_adoption: <Layers className="w-4 h-4" />,
};

const COMPONENT_COLORS: Record<string, string> = {
  usage: "text-blue-600 bg-blue-50",
  support: "text-teal-600 bg-teal-50",
  billing: "text-green-600 bg-green-50",
  engagement: "text-purple-600 bg-purple-50",
  nps: "text-yellow-600 bg-yellow-50",
  feature_adoption: "text-orange-600 bg-orange-50",
};

const DEFAULT_COMPONENTS: FormulaComponent[] = [
  {
    key: "usage",
    label: "Usage",
    weight: 25,
    enabled: true,
    description: "Product usage frequency, sessions, and depth of engagement",
  },
  {
    key: "support",
    label: "Support",
    weight: 20,
    enabled: true,
    description: "Open tickets, resolution time, and CSAT score",
  },
  {
    key: "billing",
    label: "Billing",
    weight: 20,
    enabled: true,
    description: "Payment reliability, failed charges, and subscription health",
  },
  {
    key: "engagement",
    label: "Engagement",
    weight: 15,
    enabled: true,
    description: "User logins, DAU/MAU ratio, and active seat utilization",
  },
  {
    key: "nps",
    label: "NPS",
    weight: 10,
    enabled: true,
    description: "Net Promoter Score responses and survey completion",
  },
  {
    key: "feature_adoption",
    label: "Feature Adoption",
    weight: 10,
    enabled: true,
    description: "Breadth of features used relative to plan entitlements",
  },
];

// Example account data for preview
const PREVIEW_ACCOUNTS = [
  {
    name: "Acme Corp",
    scores: { usage: 85, support: 90, billing: 100, engagement: 78, nps: 80, feature_adoption: 72 },
  },
  {
    name: "Beta LLC",
    scores: { usage: 55, support: 60, billing: 80, engagement: 45, nps: 50, feature_adoption: 40 },
  },
  {
    name: "Gamma Inc",
    scores: { usage: 20, support: 30, billing: 45, engagement: 15, nps: 25, feature_adoption: 10 },
  },
];

// ------------------------------------------------------------------
// Slider component
// ------------------------------------------------------------------

function WeightSlider({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="flex-1 h-2 rounded-full accent-blue-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: disabled
            ? "#e2e8f0"
            : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${value}%, #e2e8f0 ${value}%, #e2e8f0 100%)`,
        }}
      />
      <span className="w-9 text-right text-sm font-mono font-semibold text-foreground tabular-nums">
        {value}
      </span>
    </div>
  );
}

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------

export function FormulaBuilder() {
  const [formula, setFormula] = useState<Formula>({
    name: "Default Formula",
    components: DEFAULT_COMPONENTS,
    thresholds: { green: 70, yellow: 40 },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [showPreview, setShowPreview] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Fetch active formula on mount
  useEffect(() => {
    fetch("/api/formula")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.components && Array.isArray(data.components)) {
          setFormula({
            id: data.id,
            name: data.name ?? "Default Formula",
            components: data.components,
            thresholds: data.thresholds ?? { green: 70, yellow: 40 },
          });
        }
      })
      .catch(() => {/* keep defaults */})
      .finally(() => setLoading(false));
  }, []);

  const enabledComponents = formula.components.filter((c) => c.enabled);
  const totalWeight = enabledComponents.reduce((sum, c) => sum + c.weight, 0);
  const weightOk = totalWeight === 100;

  const updateWeight = useCallback((key: string, weight: number) => {
    setFormula((prev) => ({
      ...prev,
      components: prev.components.map((c) =>
        c.key === key ? { ...c, weight } : c
      ),
    }));
    setSaveStatus("idle");
  }, []);

  const toggleComponent = useCallback((key: string) => {
    setFormula((prev) => ({
      ...prev,
      components: prev.components.map((c) =>
        c.key === key ? { ...c, enabled: !c.enabled } : c
      ),
    }));
    setSaveStatus("idle");
  }, []);

  const normalizeWeights = useCallback(() => {
    setFormula((prev) => {
      const enabled = prev.components.filter((c) => c.enabled);
      if (enabled.length === 0) return prev;
      const total = enabled.reduce((s, c) => s + c.weight, 0);
      if (total === 0) return prev;
      const normalized = prev.components.map((c) => {
        if (!c.enabled) return c;
        return { ...c, weight: Math.round((c.weight / total) * 100) };
      });
      // Fix rounding
      const newEnabled = normalized.filter((c) => c.enabled);
      const newTotal = newEnabled.reduce((s, c) => s + c.weight, 0);
      if (newTotal !== 100 && newEnabled.length > 0) {
        const last = newEnabled[newEnabled.length - 1];
        return {
          ...prev,
          components: normalized.map((c) =>
            c.key === last.key ? { ...c, weight: c.weight + (100 - newTotal) } : c
          ),
        };
      }
      return { ...prev, components: normalized };
    });
    setSaveStatus("idle");
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/formula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formula),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      if (saved?.id) setFormula((p) => ({ ...p, id: saved.id }));
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  // Drag-and-drop reorder
  function handleDragStart(idx: number) {
    setDragIndex(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    setFormula((prev) => {
      const comps = [...prev.components];
      const [dragged] = comps.splice(dragIndex, 1);
      comps.splice(idx, 0, dragged);
      return { ...prev, components: comps };
    });
    setDragIndex(idx);
  }

  function handleDragEnd() {
    setDragIndex(null);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading formula...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Health Score Formula</CardTitle>
              <CardDescription className="mt-1">
                Configure how each component is weighted to compute the overall health
                score. Enable/disable signals and drag to reorder.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!weightOk && enabledComponents.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={normalizeWeights}
                  className="gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Auto-balance
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saving || !weightOk}
                size="sm"
                className="gap-1.5"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveStatus === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving
                  ? "Saving..."
                  : saveStatus === "success"
                  ? "Saved!"
                  : "Save Formula"}
              </Button>
            </div>
          </div>

          {/* Weight total indicator */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5 text-sm">
              <span className="text-muted-foreground">Total weight</span>
              <span
                className={`font-bold tabular-nums ${
                  weightOk
                    ? "text-green-600"
                    : totalWeight > 100
                    ? "text-red-600"
                    : "text-orange-600"
                }`}
              >
                {totalWeight} / 100
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  weightOk
                    ? "bg-green-500"
                    : totalWeight > 100
                    ? "bg-red-500"
                    : "bg-orange-400"
                }`}
                style={{ width: `${Math.min(totalWeight, 100)}%` }}
              />
            </div>
            {!weightOk && enabledComponents.length > 0 && (
              <p className="text-xs text-orange-600 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Weights must total exactly 100. Currently{" "}
                {totalWeight > 100 ? "over" : "under"} by{" "}
                {Math.abs(100 - totalWeight)}.
              </p>
            )}
            {saveStatus === "error" && (
              <p className="text-xs text-red-600 mt-1.5">
                Failed to save formula. Please try again.
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-2 pb-6">
          {formula.components.map((component, idx) => (
            <div
              key={component.key}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`border rounded-xl p-4 transition-all duration-150 ${
                dragIndex === idx
                  ? "opacity-50 border-blue-300 bg-blue-50/50"
                  : component.enabled
                  ? "border-border bg-white hover:border-slate-300"
                  : "border-dashed border-slate-200 bg-slate-50/50 opacity-60"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Drag handle */}
                <div className="mt-0.5 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Icon */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    COMPONENT_COLORS[component.key] ?? "text-slate-600 bg-slate-100"
                  }`}
                >
                  {COMPONENT_ICONS[component.key]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-foreground">
                      {component.label}
                    </span>
                    {/* Toggle */}
                    <button
                      onClick={() => toggleComponent(component.key)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        component.enabled ? "bg-blue-600" : "bg-slate-200"
                      }`}
                      role="switch"
                      aria-checked={component.enabled}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          component.enabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {component.description}
                  </p>
                  <WeightSlider
                    value={component.weight}
                    onChange={(v) => updateWeight(component.key, v)}
                    disabled={!component.enabled}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Thresholds */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Segment Thresholds</CardTitle>
          <CardDescription>
            Define the score boundaries that determine account segment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ThresholdBox
              label="Healthy (Green)"
              description={`Score ≥ ${formula.thresholds.green}`}
              color="bg-green-500"
              range={`${formula.thresholds.green} – 100`}
            />
            <ThresholdBox
              label="At Risk (Yellow)"
              description={`Score ${formula.thresholds.yellow} – ${formula.thresholds.green - 1}`}
              color="bg-yellow-400"
              range={`${formula.thresholds.yellow} – ${formula.thresholds.green - 1}`}
            />
            <ThresholdBox
              label="Critical (Red)"
              description={`Score < ${formula.thresholds.yellow}`}
              color="bg-red-500"
              range={`0 – ${formula.thresholds.yellow - 1}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Healthy threshold (min score)
              </label>
              <div className="mt-1.5">
                <WeightSlider
                  value={formula.thresholds.green}
                  onChange={(v) => {
                    setFormula((p) => ({
                      ...p,
                      thresholds: { ...p.thresholds, green: v },
                    }));
                    setSaveStatus("idle");
                  }}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                At Risk threshold (min score)
              </label>
              <div className="mt-1.5">
                <WeightSlider
                  value={formula.thresholds.yellow}
                  onChange={(v) => {
                    setFormula((p) => ({
                      ...p,
                      thresholds: { ...p.thresholds, yellow: v },
                    }));
                    setSaveStatus("idle");
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Impact */}
      <Card>
        <CardHeader className="pb-0">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setShowPreview((p) => !p)}
          >
            <div>
              <CardTitle className="text-base">Preview Impact</CardTitle>
              <CardDescription className="mt-0.5">
                See how this formula would score example accounts
              </CardDescription>
            </div>
            {showPreview ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {showPreview && (
          <CardContent className="pt-4">
            <div className="space-y-3">
              {PREVIEW_ACCOUNTS.map((acc) => {
                const score = weightOk
                  ? calculateWeightedScore(
                      {
                        usage_score: acc.scores.usage,
                        support_score: acc.scores.support,
                        billing_score: acc.scores.billing,
                        engagement_score: acc.scores.engagement,
                        nps_score: acc.scores.nps,
                        feature_adoption_score: acc.scores.feature_adoption,
                      },
                      formula.components.map((c) => ({
                        key: c.key,
                        weight: c.weight,
                        enabled: c.enabled,
                      }))
                    )
                  : null;

                const segment =
                  score === null
                    ? null
                    : score >= formula.thresholds.green
                    ? "Healthy"
                    : score >= formula.thresholds.yellow
                    ? "At Risk"
                    : "Critical";
                const segColor =
                  score === null
                    ? "text-muted-foreground"
                    : score >= formula.thresholds.green
                    ? "text-green-600"
                    : score >= formula.thresholds.yellow
                    ? "text-yellow-600"
                    : "text-red-600";

                return (
                  <div
                    key={acc.name}
                    className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground">
                        {acc.name}
                      </div>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {formula.components
                          .filter((c) => c.enabled)
                          .map((c) => (
                            <span
                              key={c.key}
                              className="text-xs text-muted-foreground"
                            >
                              {c.label}:{" "}
                              <span className="font-medium text-foreground">
                                {acc.scores[c.key as keyof typeof acc.scores]}
                              </span>
                            </span>
                          ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold tabular-nums ${segColor}`}>
                        {score ?? "—"}
                      </div>
                      <div className={`text-xs font-medium ${segColor}`}>
                        {segment ?? "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!weightOk && (
              <p className="text-xs text-orange-600 mt-3 text-center">
                Scores can only be previewed when weights total 100
              </p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function ThresholdBox({
  label,
  description,
  color,
  range,
}: {
  label: string;
  description: string;
  color: string;
  range: string;
}) {
  return (
    <div className="border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="text-xs text-muted-foreground">{description}</div>
      <div className="text-xs font-mono text-foreground mt-1 bg-slate-100 px-2 py-0.5 rounded w-fit">
        {range}
      </div>
    </div>
  );
}
