// ============================================================
// HealthScore — Core TypeScript Types
// ============================================================

export type Plan = "free" | "starter" | "growth" | "scale";
export type PlanStatus = "active" | "past_due" | "canceled" | "trialing";
export type AccountStatus = "active" | "churned" | "trial" | "paused";
export type SegmentColor = "green" | "yellow" | "red";
export type ChurnRiskLabel = "low" | "medium" | "high" | "critical";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertType =
  | "churn_risk"
  | "score_drop"
  | "payment_failed"
  | "renewal_upcoming"
  | "segment_change"
  | "manual"
  | "playbook";
export type IntegrationType =
  | "stripe"
  | "intercom"
  | "helpscout"
  | "zendesk"
  | "segment"
  | "mixpanel"
  | "amplitude"
  | "hubspot"
  | "custom";
export type PlaybookTrigger =
  | "score_threshold"
  | "score_drop"
  | "churn_risk"
  | "renewal_upcoming"
  | "segment_change"
  | "manual";
export type ActionType =
  | "slack_alert"
  | "email"
  | "hubspot_sequence"
  | "webhook"
  | "create_task"
  | "update_segment";
export type RenewalStatus =
  | "upcoming"
  | "at_risk"
  | "renewed"
  | "churned"
  | "expanded";

// ============================================================
// Database Row Types
// ============================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan: Plan;
  plan_status: PlanStatus;
  max_accounts: number;
  max_integrations: number;
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id?: string;
  full_name?: string;
  avatar_url?: string;
  role: "owner" | "admin" | "member";
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  organization_id: string;
  status: string;
  price_id?: string;
  quantity: number;
  cancel_at_period_end: boolean;
  cancel_at?: string;
  canceled_at?: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  organization_id: string;
  name: string;
  domain?: string;
  external_id?: string;
  plan?: string;
  mrr: number;
  arr: number;
  seats: number;
  contract_start_date?: string;
  renewal_date?: string;
  csm_id?: string;
  tags: string[];
  custom_fields: Record<string, unknown>;
  status: AccountStatus;
  segment: SegmentColor;
  created_at: string;
  updated_at: string;
  // Joined
  health_score?: HealthScore;
  csm?: Profile;
}

export interface HealthScore {
  id: string;
  organization_id: string;
  account_id: string;
  overall_score: number;
  usage_score: number;
  support_score: number;
  billing_score: number;
  engagement_score: number;
  nps_score: number;
  feature_adoption_score: number;
  raw_metrics: Record<string, unknown>;
  churn_risk: number;
  churn_risk_label: ChurnRiskLabel;
  churn_predicted_at?: string;
  calculated_at: string;
  formula_version: number;
}

export interface HealthScoreHistory {
  id: string;
  organization_id: string;
  account_id: string;
  overall_score: number;
  usage_score?: number;
  support_score?: number;
  billing_score?: number;
  engagement_score?: number;
  nps_score?: number;
  feature_adoption_score?: number;
  churn_risk?: number;
  snapshot_date: string;
  created_at: string;
}

export interface FormulaComponent {
  key: string;
  label: string;
  weight: number;
  enabled: boolean;
  description?: string;
}

export interface ScoreThresholds {
  green: number; // e.g. 70 (70-100 = green)
  yellow: number; // e.g. 40 (40-69 = yellow, 0-39 = red)
}

export interface HealthScoreFormula {
  id: string;
  organization_id: string;
  name: string;
  is_active: boolean;
  version: number;
  components: FormulaComponent[];
  thresholds: ScoreThresholds;
  created_at: string;
  updated_at: string;
}

export interface Integration {
  id: string;
  organization_id: string;
  type: IntegrationType;
  name: string;
  webhook_secret: string;
  is_active: boolean;
  config: Record<string, unknown>;
  last_event_at?: string;
  event_count: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  organization_id: string;
  integration_id: string;
  account_id?: string;
  event_type: string;
  source: string;
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at?: string;
  error?: string;
  created_at: string;
}

export interface Playbook {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  trigger_type: PlaybookTrigger;
  trigger_config: Record<string, unknown>;
  conditions: PlaybookCondition[];
  run_count: number;
  last_run_at?: string;
  created_at: string;
  updated_at: string;
  // Joined
  actions?: PlaybookAction[];
}

export interface PlaybookCondition {
  field: string;
  operator: ">" | "<" | ">=" | "<=" | "==" | "!=" | "contains";
  value: string | number;
}

export interface PlaybookAction {
  id: string;
  playbook_id: string;
  organization_id: string;
  action_type: ActionType;
  config: Record<string, unknown>;
  sort_order: number;
  created_at: string;
}

export interface PlaybookRun {
  id: string;
  playbook_id: string;
  account_id: string;
  organization_id: string;
  status: "pending" | "running" | "completed" | "failed";
  triggered_by: string;
  actions_completed: number;
  actions_failed: number;
  result: Record<string, unknown>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  // Joined
  account?: Account;
  playbook?: Playbook;
}

export interface Segment {
  id: string;
  organization_id: string;
  name: string;
  color: SegmentColor | "custom";
  hex_color: string;
  min_score: number;
  max_score: number;
  description?: string;
  is_system: boolean;
  account_count: number;
  created_at: string;
  updated_at: string;
}

export interface Renewal {
  id: string;
  organization_id: string;
  account_id: string;
  renewal_date: string;
  contract_value?: number;
  status: RenewalStatus;
  health_score_at_renewal?: number;
  notes?: string;
  owner_id?: string;
  reminder_sent_at?: string;
  created_at: string;
  updated_at: string;
  // Joined
  account?: Account;
  owner?: Profile;
}

export interface Alert {
  id: string;
  organization_id: string;
  account_id?: string;
  playbook_run_id?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  is_read: boolean;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  // Joined
  account?: Account;
}

export interface Contact {
  id: string;
  organization_id: string;
  account_id: string;
  name: string;
  email?: string;
  title?: string;
  phone?: string;
  is_primary: boolean;
  last_active_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  organization_id: string;
  account_id: string;
  author_id?: string;
  content: string;
  type: "note" | "call" | "meeting" | "email";
  created_at: string;
  updated_at: string;
  // Joined
  author?: Profile;
}

// ============================================================
// Dashboard / UI Types
// ============================================================

export interface DashboardStats {
  total_accounts: number;
  green_accounts: number;
  yellow_accounts: number;
  red_accounts: number;
  avg_health_score: number;
  at_risk_mrr: number;
  total_mrr: number;
  alerts_unread: number;
  renewals_next_30_days: number;
}

export interface ChurnPrediction {
  account_id: string;
  account_name: string;
  current_score: number;
  predicted_churn_probability: number;
  risk_label: ChurnRiskLabel;
  key_factors: string[];
  recommended_actions: string[];
  days_until_renewal?: number;
}

// ============================================================
// API / Request Types
// ============================================================

export interface WebhookPayload {
  type: string;
  data: Record<string, unknown>;
  timestamp?: string;
}

export interface HealthScoreInput {
  account_id: string;
  usage_events?: number;
  support_tickets_open?: number;
  support_tickets_total?: number;
  csat_score?: number;
  payment_failures?: number;
  days_since_login?: number;
  nps?: number;
  features_used?: number;
  total_features?: number;
}
