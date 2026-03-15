// AI Presets — Formula presets, playbook templates, and churn prediction presets

import type { FormulaComponent, PlaybookTrigger, ActionType } from "@/lib/types";

// ─── Health Score Formula Presets ─────────────────────────────

export interface FormulaPreset {
  id: string;
  name: string;
  description: string;
  components: FormulaComponent[];
}

export const FORMULA_PRESETS: FormulaPreset[] = [
  {
    id: "usage-based",
    name: "Usage-Based",
    description: "Weight login frequency, feature adoption, and time in app",
    components: [
      { key: "usage", label: "Product Usage", weight: 35, enabled: true, description: "How actively customers use your product" },
      { key: "engagement", label: "Login Frequency", weight: 25, enabled: true, description: "How often users log in" },
      { key: "feature_adoption", label: "Feature Adoption", weight: 20, enabled: true, description: "Percentage of features being used" },
      { key: "support", label: "Support Health", weight: 10, enabled: true, description: "Support ticket volume and satisfaction" },
      { key: "billing", label: "Billing Health", weight: 5, enabled: true, description: "Payment status and revenue trends" },
      { key: "nps", label: "NPS Score", weight: 5, enabled: true, description: "Net Promoter Score responses" },
    ],
  },
  {
    id: "engagement-based",
    name: "Engagement-Based",
    description: "Weight support tickets, NPS responses, and feature requests",
    components: [
      { key: "support", label: "Support Health", weight: 30, enabled: true, description: "Support ticket volume and satisfaction" },
      { key: "nps", label: "NPS Score", weight: 25, enabled: true, description: "Net Promoter Score responses" },
      { key: "engagement", label: "Login Frequency", weight: 20, enabled: true, description: "How often users log in" },
      { key: "feature_adoption", label: "Feature Adoption", weight: 15, enabled: true, description: "Percentage of features being used" },
      { key: "usage", label: "Product Usage", weight: 5, enabled: true, description: "How actively customers use your product" },
      { key: "billing", label: "Billing Health", weight: 5, enabled: true, description: "Payment status and revenue trends" },
    ],
  },
  {
    id: "revenue-based",
    name: "Revenue-Based",
    description: "Weight MRR, expansion, contraction, and payment failures",
    components: [
      { key: "billing", label: "Billing Health", weight: 40, enabled: true, description: "Payment status and revenue trends" },
      { key: "usage", label: "Product Usage", weight: 20, enabled: true, description: "How actively customers use your product" },
      { key: "engagement", label: "Login Frequency", weight: 15, enabled: true, description: "How often users log in" },
      { key: "support", label: "Support Health", weight: 10, enabled: true, description: "Support ticket volume and satisfaction" },
      { key: "nps", label: "NPS Score", weight: 10, enabled: true, description: "Net Promoter Score responses" },
      { key: "feature_adoption", label: "Feature Adoption", weight: 5, enabled: true, description: "Percentage of features being used" },
    ],
  },
  {
    id: "balanced",
    name: "Balanced",
    description: "Equal weight across all signals for a balanced view",
    components: [
      { key: "usage", label: "Product Usage", weight: 20, enabled: true, description: "How actively customers use your product" },
      { key: "support", label: "Support Health", weight: 20, enabled: true, description: "Support ticket volume and satisfaction" },
      { key: "billing", label: "Billing Health", weight: 20, enabled: true, description: "Payment status and revenue trends" },
      { key: "engagement", label: "Login Frequency", weight: 15, enabled: true, description: "How often users log in" },
      { key: "nps", label: "NPS Score", weight: 15, enabled: true, description: "Net Promoter Score responses" },
      { key: "feature_adoption", label: "Feature Adoption", weight: 10, enabled: true, description: "Percentage of features being used" },
    ],
  },
];

// ─── Playbook Templates ──────────────────────────────────────

export interface PlaybookTemplate {
  id: string;
  name: string;
  description: string;
  trigger_type: PlaybookTrigger;
  trigger_config: Record<string, unknown>;
  conditions: Array<{ field: string; operator: string; value: string | number }>;
  actions: Array<{
    action_type: ActionType;
    config: Record<string, unknown>;
  }>;
}

export const PLAYBOOK_TEMPLATES: PlaybookTemplate[] = [
  {
    id: "at-risk-recovery",
    name: "At-Risk Recovery",
    description: "Trigger when score drops below 40 — send check-in email, assign CSM",
    trigger_type: "score_threshold",
    trigger_config: { score_below: 40 },
    conditions: [],
    actions: [
      {
        action_type: "email",
        config: {
          to: "{{csm_email}}",
          subject: "Urgent: {{account_name}} health score is critical",
          body: "{{account_name}} health score dropped to {{score}}. Please schedule a check-in call within 48 hours.",
        },
      },
      {
        action_type: "slack_alert",
        config: {
          channel: "#cs-alerts",
          message: "🚨 {{account_name}} health score dropped below 40 (currently {{score}}). Immediate action required.",
        },
      },
      {
        action_type: "create_task",
        config: {
          title: "Urgent: Schedule recovery call with {{account_name}}",
          assignee: "csm",
        },
      },
    ],
  },
  {
    id: "expansion-ready",
    name: "Expansion Ready",
    description: "Trigger when score above 80 + usage growing — send upsell nudge",
    trigger_type: "score_threshold",
    trigger_config: { score_above: 80 },
    conditions: [{ field: "segment", operator: "==", value: "green" }],
    actions: [
      {
        action_type: "email",
        config: {
          to: "{{csm_email}}",
          subject: "Expansion opportunity: {{account_name}} is thriving",
          body: "{{account_name}} has a health score of {{score}} and is showing strong growth signals. Consider reaching out about plan upgrades or additional seats.",
        },
      },
      {
        action_type: "create_task",
        config: {
          title: "Review expansion opportunity for {{account_name}}",
          assignee: "csm",
        },
      },
    ],
  },
  {
    id: "onboarding-follow-up",
    name: "Onboarding Follow-Up",
    description: "Trigger 7 days after signup if score below 60",
    trigger_type: "score_threshold",
    trigger_config: { score_below: 60 },
    conditions: [],
    actions: [
      {
        action_type: "email",
        config: {
          to: "{{csm_email}}",
          subject: "Onboarding follow-up needed: {{account_name}}",
          body: "{{account_name}} signed up recently but their health score is {{score}}. They may need help getting started. Schedule a quick onboarding call.",
        },
      },
      {
        action_type: "create_task",
        config: {
          title: "Onboarding follow-up: help {{account_name}} get started",
          assignee: "csm",
        },
      },
    ],
  },
  {
    id: "renewal-prep",
    name: "Renewal Prep",
    description: "Trigger 30 days before renewal date",
    trigger_type: "renewal_upcoming",
    trigger_config: { days_before: 30 },
    conditions: [],
    actions: [
      {
        action_type: "email",
        config: {
          to: "{{csm_email}}",
          subject: "Renewal prep: {{account_name}} renews in {{days}} days",
          body: "{{account_name}} renewal is coming up. Current health score: {{score}}. Contract value: {{contract_value}}. Review account and schedule renewal call.",
        },
      },
      {
        action_type: "slack_alert",
        config: {
          channel: "#renewals",
          message: "📅 {{account_name}} renewal in {{days}} days. Health score: {{score}}.",
        },
      },
    ],
  },
];

// ─── Churn Prediction Action Presets ─────────────────────────

export interface ChurnActionPreset {
  riskLevel: "critical" | "high" | "medium" | "low";
  minProbability: number;
  maxProbability: number;
  recommendation: string;
  urgency: string;
  color: string;
}

export const CHURN_ACTION_PRESETS: ChurnActionPreset[] = [
  {
    riskLevel: "critical",
    minProbability: 80,
    maxProbability: 100,
    recommendation: "Schedule urgent call within 48 hours",
    urgency: "Immediate",
    color: "text-red-700 bg-red-50 border-red-200",
  },
  {
    riskLevel: "high",
    minProbability: 40,
    maxProbability: 79,
    recommendation: "Send personalized check-in email",
    urgency: "This week",
    color: "text-orange-700 bg-orange-50 border-orange-200",
  },
  {
    riskLevel: "medium",
    minProbability: 20,
    maxProbability: 39,
    recommendation: "Monitor — schedule touchpoint next sprint",
    urgency: "This month",
    color: "text-yellow-700 bg-yellow-50 border-yellow-200",
  },
  {
    riskLevel: "low",
    minProbability: 0,
    maxProbability: 19,
    recommendation: "Monitor — no action needed",
    urgency: "None",
    color: "text-green-700 bg-green-50 border-green-200",
  },
];

export function getChurnActionPreset(probability: number): ChurnActionPreset {
  return (
    CHURN_ACTION_PRESETS.find(
      (p) => probability >= p.minProbability && probability <= p.maxProbability
    ) || CHURN_ACTION_PRESETS[3]
  );
}
