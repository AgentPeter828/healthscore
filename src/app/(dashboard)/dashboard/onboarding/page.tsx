"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Building2,
  Plug,
  Users,
  Bell,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Check,
  AlertCircle,
  Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

type IntegrationOption = "stripe" | "intercom" | "zendesk" | "segment";

// ─── Step indicator ───────────────────────────────────────────

const STEPS = [
  { label: "Your Company", icon: Building2 },
  { label: "Integration", icon: Plug },
  { label: "First Account", icon: Users },
  { label: "Slack Alerts", icon: Bell },
  { label: "All Set!", icon: CheckCircle2 },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                  done
                    ? "bg-green-500 text-white"
                    : active
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-400"
                )}
              >
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={cn(
                  "text-xs hidden sm:block",
                  active ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-8 sm:w-12 mx-1 mt-0 sm:-mt-5 transition-colors",
                  done ? "bg-green-400" : "bg-slate-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Integration options ──────────────────────────────────────

const INTEGRATION_OPTIONS: {
  id: IntegrationOption;
  name: string;
  description: string;
  emoji: string;
}[] = [
  { id: "stripe", name: "Stripe", description: "MRR, payment data, subscriptions", emoji: "💳" },
  { id: "intercom", name: "Intercom", description: "Support tickets, CSAT, conversations", emoji: "💬" },
  { id: "zendesk", name: "Zendesk", description: "Ticket volume, resolution time", emoji: "🎫" },
  { id: "segment", name: "Segment", description: "Product events, DAU/MAU", emoji: "📊" },
];

// ─── Main component ───────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [orgName, setOrgName] = useState("");
  const [selectedIntegration, setSelectedIntegration] =
    useState<IntegrationOption | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountDomain, setAccountDomain] = useState("");
  const [accountMrr, setAccountMrr] = useState("");
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");

  // Track which steps completed what
  const [completedOrg, setCompletedOrg] = useState(false);
  const [completedIntegration, setCompletedIntegration] = useState(false);
  const [completedAccount, setCompletedAccount] = useState(false);
  const [completedSlack, setCompletedSlack] = useState(false);

  // ─── Step 0: Company name ─────────────────────────────────

  const handleStep0 = async () => {
    if (!orgName.trim()) {
      setError("Please enter your company name.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Failed to save organization name.");
        return;
      }
      setCompletedOrg(true);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 1: Integration ──────────────────────────────────

  const handleStep1 = async (skip = false) => {
    if (!skip && !selectedIntegration) {
      setError("Please choose an integration to connect.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (!skip && selectedIntegration) {
        await fetch("/api/onboarding/integration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: selectedIntegration }),
        });
        setCompletedIntegration(true);
      }
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: First account ────────────────────────────────

  const handleStep2 = async (skip = false) => {
    if (!skip && !accountName.trim()) {
      setError("Please enter an account name.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (!skip && accountName.trim()) {
        const mrr = parseFloat(accountMrr) || 0;
        const res = await fetch("/api/onboarding/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: accountName.trim(),
            domain: accountDomain.trim() || undefined,
            mrr,
            arr: mrr * 12,
            status: "active",
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError((data as { error?: string }).error ?? "Failed to create account.");
          return;
        }
        setCompletedAccount(true);
      }
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Slack ────────────────────────────────────────

  const handleStep3 = async (skip = false) => {
    setLoading(true);
    setError("");
    try {
      if (!skip && slackWebhookUrl.trim()) {
        await fetch("/api/onboarding/slack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slack_webhook_url: slackWebhookUrl.trim() }),
        });
        setCompletedSlack(true);
      }
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">HealthScore</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Get started in a few quick steps
          </p>
        </div>

        {/* Progress */}
        <StepIndicator currentStep={step} />

        {/* Card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8">

          {/* ── Step 0: Company ── */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  What do you call your company?
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  This is how your organization will appear in HealthScore.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org_name">Company Name</Label>
                <Input
                  id="org_name"
                  placeholder="Acme Corp"
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleStep0()}
                  autoFocus
                  className="h-11 text-base"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </p>
              )}

              <Button
                onClick={handleStep0}
                disabled={loading || !orgName.trim()}
                className="w-full gap-1.5"
                size="lg"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* ── Step 1: Integration ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Plug className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Add your first integration
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect a data source to power health score calculations.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {INTEGRATION_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedIntegration(option.id);
                      setError("");
                    }}
                    className={cn(
                      "rounded-xl border-2 p-4 text-left transition-all",
                      selectedIntegration === option.id
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-300"
                        : "border-border hover:border-slate-300 bg-white"
                    )}
                  >
                    <div className="text-2xl mb-1">{option.emoji}</div>
                    <div className="font-semibold text-sm text-foreground">
                      {option.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </div>
                    {selectedIntegration === option.id && (
                      <div className="mt-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleStep1(true)}
                  disabled={loading}
                  className="flex-1"
                >
                  Skip for now
                </Button>
                <Button
                  onClick={() => handleStep1(false)}
                  disabled={loading || !selectedIntegration}
                  className="flex-1 gap-1.5"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Connect
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: First account ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Add your first customer account
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Add a customer to start tracking their health score right away.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="account_name">Account Name *</Label>
                  <Input
                    id="account_name"
                    placeholder="Globex Corporation"
                    value={accountName}
                    onChange={(e) => {
                      setAccountName(e.target.value);
                      setError("");
                    }}
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="account_domain">Domain</Label>
                  <Input
                    id="account_domain"
                    placeholder="globex.com"
                    value={accountDomain}
                    onChange={(e) => setAccountDomain(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="account_mrr">Monthly Recurring Revenue (MRR)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="account_mrr"
                      type="number"
                      min={0}
                      placeholder="2500"
                      className="pl-7"
                      value={accountMrr}
                      onChange={(e) => setAccountMrr(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleStep2(true)}
                  disabled={loading}
                  className="flex-1"
                >
                  Skip for now
                </Button>
                <Button
                  onClick={() => handleStep2(false)}
                  disabled={loading || !accountName.trim()}
                  className="flex-1 gap-1.5"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Account
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Slack ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Set up Slack alerts (optional)
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Get notified in Slack when a customer&apos;s health score changes.
                  You can configure this later in{" "}
                  <span className="font-medium">Settings → Notifications</span>.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slack_url">Slack Incoming Webhook URL</Label>
                <Input
                  id="slack_url"
                  type="url"
                  placeholder="https://hooks.slack.com/services/T.../B.../..."
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Create one at{" "}
                  <a
                    href="https://api.slack.com/messaging/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    api.slack.com/messaging/webhooks
                  </a>
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleStep3(true)}
                  disabled={loading}
                  className="flex-1"
                >
                  Skip for now
                </Button>
                <Button
                  onClick={() => handleStep3(false)}
                  disabled={loading}
                  className="flex-1 gap-1.5"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {slackWebhookUrl.trim() ? "Save & Continue" : "Skip"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 4: Done ── */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-9 h-9 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  You&apos;re all set!
                </h2>
                <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">
                  HealthScore is ready. Your dashboard is waiting.
                </p>
              </div>

              {/* Quick-start checklist */}
              <div className="bg-slate-50 rounded-xl border border-border p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Setup Summary
                </p>
                {[
                  { done: completedOrg, label: "Organization created" },
                  { done: completedIntegration, label: "Integration connected" },
                  { done: completedAccount, label: "First account added" },
                  { done: completedSlack, label: "Slack alerts configured" },
                ].map(({ done, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                        done ? "bg-green-500" : "bg-slate-200"
                      )}
                    >
                      {done ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      )}
                    </div>
                    <span
                      className={done ? "text-foreground" : "text-muted-foreground"}
                    >
                      {label}
                    </span>
                    {!done && (
                      <span className="ml-auto text-xs text-muted-foreground italic">
                        skipped
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full gap-1.5"
                  size="lg"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <div className="flex gap-2 text-sm">
                  <Link
                    href="/dashboard/integrations"
                    className="flex-1 text-center text-blue-600 hover:text-blue-500 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Set up integrations
                  </Link>
                  <Link
                    href="/dashboard/settings?tab=team"
                    className="flex-1 text-center text-blue-600 hover:text-blue-500 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Invite your team
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step counter */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Step {Math.min(step + 1, STEPS.length)} of {STEPS.length}
        </p>
      </div>
    </div>
  );
}
