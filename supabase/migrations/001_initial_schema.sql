-- HealthScore Initial Schema
-- Run this in your Supabase SQL editor or via CLI

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'growth', 'scale')),
  plan_status TEXT NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active', 'past_due', 'canceled', 'trialing')),
  max_accounts INTEGER NOT NULL DEFAULT 50,
  max_integrations INTEGER NOT NULL DEFAULT 1,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES hs_organizations(id) ON DELETE SET NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTIONS (mirrors Stripe)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY, -- Stripe subscription ID
  organization_id UUID NOT NULL REFERENCES hs_organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  price_id TEXT,
  quantity INTEGER DEFAULT 1,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HS_ACCOUNTS (customer accounts being tracked)
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES hs_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  external_id TEXT, -- ID in your CRM / data source
  plan TEXT,
  mrr DECIMAL(10,2) DEFAULT 0,
  arr DECIMAL(10,2) DEFAULT 0,
  seats INTEGER DEFAULT 1,
  contract_start_date DATE,
  renewal_date DATE,
  csm_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'churned', 'trial', 'paused')),
  segment TEXT DEFAULT 'green' CHECK (segment IN ('green', 'yellow', 'red')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HS_HEALTH_SCORES
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_health_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES hs_organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES hs_accounts(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  -- Component scores
  usage_score INTEGER DEFAULT 0 CHECK (usage_score >= 0 AND usage_score <= 100),
  support_score INTEGER DEFAULT 0 CHECK (support_score >= 0 AND support_score <= 100),
  billing_score INTEGER DEFAULT 0 CHECK (billing_score >= 0 AND billing_score <= 100),
  engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  nps_score INTEGER DEFAULT 0 CHECK (nps_score >= 0 AND nps_score <= 100),
  feature_adoption_score INTEGER DEFAULT 0 CHECK (feature_adoption_score >= 0 AND feature_adoption_score <= 100),
  -- Raw data
  raw_metrics JSONB DEFAULT '{}',
  -- AI predictions
  churn_risk DECIMAL(5,4) DEFAULT 0 CHECK (churn_risk >= 0 AND churn_risk <= 1),
  churn_risk_label TEXT DEFAULT 'low' CHECK (churn_risk_label IN ('low', 'medium', 'high', 'critical')),
  churn_predicted_at TIMESTAMPTZ,
  -- Metadata
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  formula_version INTEGER DEFAULT 1,
  UNIQUE(account_id)
);

-- ============================================================
-- HS_HEALTH_SCORE_HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_health_score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES hs_organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES hs_accounts(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL,
  usage_score INTEGER,
  support_score INTEGER,
  billing_score INTEGER,
  engagement_score INTEGER,
  nps_score INTEGER,
  feature_adoption_score INTEGER,
  churn_risk DECIMAL(5,4),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hs_health_score_history_account ON hs_health_score_history(account_id, snapshot_date DESC);

-- ============================================================
-- HS_HEALTH_SCORE_FORMULAS
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_health_score_formulas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES hs_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default Formula',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL DEFAULT 1,
  components JSONB NOT NULL DEFAULT '[
    {"key": "usage", "label": "Product Usage", "weight": 30, "enabled": true},
    {"key": "support", "label": "Support Health", "weight": 20, "enabled": true},
    {"key": "billing", "label": "Billing Health", "weight": 20, "enabled": true},
    {"key": "engagement", "label": "Login Frequency", "weight": 15, "enabled": true},
    {"key": "nps", "label": "NPS Score", "weight": 10, "enabled": true},
    {"key": "feature_adoption", "label": "Feature Adoption", "weight": 5, "enabled": true}
  ]',
  thresholds JSONB NOT NULL DEFAULT '{"green": 70, "yellow": 40}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HS_INTEGRATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES hs_organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'stripe', 'intercom', 'helpscout', 'zendesk',
    'segment', 'mixpanel', 'amplitude', 'hubspot', 'custom'
  )),
  name TEXT NOT NULL,
  webhook_secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  last_event_at TIMESTAMPTZ,
  event_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, type)
);

-- ============================================================
-- HS_WEBHOOK_EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES hs_organizations(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES hs_integrations(id) ON DELETE CASCADE,
  account_id UUID REFERENCES hs_accounts(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hs_webhook_events_org ON hs_webhook_events(organization_id, created_at DESC);
CREATE INDEX idx_hs_webhook_events_account ON hs_webhook_events(account_id, created_at DESC);
CREATE INDEX idx_hs_webhook_events_unprocessed ON hs_webhook_events(processed, created_at) WHERE processed = FALSE;

-- ============================================================
-- HS_PLAYBOOKS
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES hs_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('score_threshold', 'score_drop', 'churn_risk', 'renewal_upcoming', 'segment_change', 'manual')),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  -- e.g. {"score_below": 50} or {"drop_points": 15, "within_days": 7}
  conditions JSONB DEFAULT '[]',
  -- e.g. [{"field": "mrr", "operator": ">", "value": 1000}]
  run_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HS_PLAYBOOK_ACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_playbook_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playbook_id UUID NOT NULL REFERENCES hs_playbooks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES hs_organizations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('slack_alert', 'email', 'hubspot_sequence', 'webhook', 'create_task', 'update_segment')),
  config JSONB NOT NULL DEFAULT '{}',
  -- slack: {"channel": "#cs-alerts", "message": "..."}
  -- email: {"to": "{{csm_email}}", "subject": "...", "body": "..."}
  -- hubspot: {"sequence_id": "123", "enroll": true}
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HS_PLAYBOOK_RUNS
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_playbook_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playbook_id UUID NOT NULL REFERENCES hs_playbooks(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES hs_accounts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES hs_organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  triggered_by TEXT DEFAULT 'automatic',
  actions_completed INTEGER DEFAULT 0,
  actions_failed INTEGER DEFAULT 0,
  result JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HS_SEGMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES hs_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'green' CHECK (color IN ('green', 'yellow', 'red', 'custom')),
  hex_color TEXT DEFAULT '#22c55e',
  min_score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 100,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  account_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HS_RENEWALS
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_renewals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES hs_organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES hs_accounts(id) ON DELETE CASCADE,
  renewal_date DATE NOT NULL,
  contract_value DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'at_risk', 'renewed', 'churned', 'expanded')),
  health_score_at_renewal INTEGER,
  notes TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hs_renewals_date ON hs_renewals(organization_id, renewal_date ASC);

-- ============================================================
-- HS_ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES hs_organizations(id) ON DELETE CASCADE,
  account_id UUID REFERENCES hs_accounts(id) ON DELETE CASCADE,
  playbook_run_id UUID REFERENCES hs_playbook_runs(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('churn_risk', 'score_drop', 'payment_failed', 'renewal_upcoming', 'segment_change', 'manual', 'playbook')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hs_alerts_org ON hs_alerts(organization_id, created_at DESC);
CREATE INDEX idx_hs_alerts_unread ON hs_alerts(organization_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- HS_CONTACTS (people at customer accounts)
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES hs_organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES hs_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  title TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HS_NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES hs_organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES hs_accounts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'note' CHECK (type IN ('note', 'call', 'meeting', 'email')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE hs_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_health_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_health_score_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_playbook_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_playbook_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_notes ENABLE ROW LEVEL SECURITY;

-- Helper: get user's org
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies
CREATE POLICY "Users can view their org" ON hs_organizations
  FOR ALL USING (id = get_user_org_id());

CREATE POLICY "Users can manage their profile" ON profiles
  FOR ALL USING (id = auth.uid() OR organization_id = get_user_org_id());

CREATE POLICY "Org members can view subscriptions" ON subscriptions
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can manage accounts" ON hs_accounts
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can view health scores" ON hs_health_scores
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can view health score history" ON hs_health_score_history
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can manage formulas" ON hs_health_score_formulas
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can manage integrations" ON hs_integrations
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can view webhook events" ON hs_webhook_events
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can manage playbooks" ON hs_playbooks
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can manage playbook actions" ON hs_playbook_actions
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can view playbook runs" ON hs_playbook_runs
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can manage segments" ON hs_segments
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can manage renewals" ON hs_renewals
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can view alerts" ON hs_alerts
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can manage contacts" ON hs_contacts
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can manage notes" ON hs_notes
  FOR ALL USING (organization_id = get_user_org_id());

-- Service role bypass for webhooks
CREATE POLICY "Service role can insert webhook events" ON hs_webhook_events
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orgs_updated BEFORE UPDATE ON hs_organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_accounts_updated BEFORE UPDATE ON hs_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_formulas_updated BEFORE UPDATE ON hs_health_score_formulas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_integrations_updated BEFORE UPDATE ON hs_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_playbooks_updated BEFORE UPDATE ON hs_playbooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_segments_updated BEFORE UPDATE ON hs_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_renewals_updated BEFORE UPDATE ON hs_renewals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED DEFAULT SEGMENTS
-- ============================================================

-- These get inserted per-org on signup (via app logic)
-- Example default segments structure for reference:
-- Green: 70-100, Yellow: 40-69, Red: 0-39
