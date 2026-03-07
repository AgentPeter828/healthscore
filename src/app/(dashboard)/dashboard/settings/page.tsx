"use client";

import { useState, useEffect, useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  Building2,
  CreditCard,
  Users,
  Bell,
  Save,
  Loader2,
  Copy,
  CheckCheck,
  Trash2,
  Mail,
  Check,
  AlertCircle,
  ScrollText,
} from "lucide-react";
import { getInitials } from "@/lib/utils";

// ─── Plan info ────────────────────────────────────────────────

interface PlanConfig {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}

const PLANS: PlanConfig[] = [
  {
    name: "Free",
    price: "$0/mo",
    features: ["Up to 25 accounts", "1 integration", "Basic health scoring"],
  },
  {
    name: "Starter",
    price: "$49/mo",
    features: ["Up to 100 accounts", "3 integrations", "Playbooks (5 max)", "Email alerts"],
  },
  {
    name: "Growth",
    price: "$149/mo",
    features: [
      "Up to 500 accounts",
      "All integrations",
      "Unlimited playbooks",
      "HubSpot CRM sync",
      "Renewal calendar",
    ],
    highlighted: true,
  },
  {
    name: "Scale",
    price: "$399/mo",
    features: [
      "Unlimited accounts",
      "All integrations",
      "Custom health formulas",
      "Dedicated CSM",
      "SLA + priority support",
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────

function ProfileTab() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    fetch("/api/settings/profile")
      .then((r) => r.json())
      .then((data) => {
        setFullName(data.full_name ?? "");
        setEmail(data.email ?? "");
        setAvatarUrl(data.avatar_url ?? "");
        setFetched(true);
      })
      .catch(() => setFetched(true));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, avatar_url: avatarUrl }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setLoading(false);
    }
  };

  if (!fetched) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Your personal account details</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            getInitials(fullName || email || "U")
          )}
        </div>
        <div className="space-y-1.5 flex-1">
          <Label htmlFor="avatar_url">Avatar URL</Label>
          <Input
            id="avatar_url"
            type="url"
            placeholder="https://..."
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          placeholder="Your name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} disabled className="bg-slate-50" />
        <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
      </div>

      <Button onClick={handleSave} disabled={loading} className="gap-1.5">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? "Saved!" : "Save Profile"}
      </Button>
    </div>
  );
}

function OrganizationTab() {
  const [orgName, setOrgName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    fetch("/api/settings/organization")
      .then((r) => r.json())
      .then((data) => {
        setOrgName(data.name ?? "");
        setLogoUrl(data.logo_url ?? "");
        setFetched(true);
      })
      .catch(() => setFetched(true));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch("/api/settings/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName, logo_url: logoUrl }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setLoading(false);
    }
  };

  if (!fetched) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Organization</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your organization settings</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="org_name">Organization Name</Label>
        <Input
          id="org_name"
          placeholder="Acme Corp"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="logo_url">Logo URL</Label>
        <Input
          id="logo_url"
          type="url"
          placeholder="https://..."
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
        />
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Logo preview"
            className="h-10 object-contain mt-2 rounded border border-border"
          />
        )}
      </div>

      <Button onClick={handleSave} disabled={loading} className="gap-1.5">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? "Saved!" : "Save Organization"}
      </Button>
    </div>
  );
}

function BillingTab() {
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [portalLoading, setPortalLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    fetch("/api/settings/billing")
      .then((r) => r.json())
      .then((data) => {
        setCurrentPlan(data.plan ?? "free");
        setFetched(true);
      })
      .catch(() => setFetched(true));
  }, []);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  };

  if (!fetched) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Billing</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your plan and billing</p>
        </div>
        <Button
          variant="outline"
          onClick={handleManageSubscription}
          disabled={portalLoading}
          className="gap-1.5"
        >
          {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          Manage Subscription
        </Button>
      </div>

      {/* Current plan */}
      <div className="bg-slate-50 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Current Plan:</span>
          <Badge variant="outline" className="capitalize font-semibold text-blue-700 bg-blue-100 border-blue-200">
            {currentPlan}
          </Badge>
        </div>
      </div>

      {/* Plan comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isActive = plan.name.toLowerCase() === currentPlan.toLowerCase();
          return (
            <div
              key={plan.name}
              className={`rounded-xl border p-4 flex flex-col ${
                plan.highlighted
                  ? "border-blue-500 ring-1 ring-blue-500"
                  : "border-border"
              } ${isActive ? "bg-blue-50" : "bg-white"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">{plan.name}</h3>
                {isActive && (
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                    Current
                  </Badge>
                )}
                {plan.highlighted && !isActive && (
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                    Popular
                  </Badge>
                )}
              </div>
              <div className="text-lg font-bold text-foreground mb-3">{plan.price}</div>
              <ul className="space-y-1.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {!isActive && (
                <Button
                  size="sm"
                  variant={plan.highlighted ? "default" : "outline"}
                  className="mt-4 w-full"
                  onClick={handleManageSubscription}
                >
                  {currentPlan === "free" ? "Upgrade" : "Switch"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TeamMember {
  id: string;
  full_name?: string;
  email: string;
  role: string;
  avatar_url?: string;
}

function TeamTab() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings/team")
      .then((r) => r.json())
      .then((data) => {
        setMembers(data.members ?? []);
        setFetched(true);
      })
      .catch(() => setFetched(true));
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError("");
    try {
      const res = await fetch("/api/settings/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      if (res.ok) {
        setInviteSent(true);
        setInviteEmail("");
        setTimeout(() => setInviteSent(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to send invite");
      }
    } finally {
      setInviting(false);
    }
  };

  if (!fetched) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Team</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage team members and send invites
        </p>
      </div>

      {/* Invite form */}
      <div className="bg-slate-50 border border-border rounded-xl p-4 space-y-3">
        <Label>Invite Team Member</Label>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          />
          <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="gap-1.5 flex-shrink-0">
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {inviteSent ? "Sent!" : "Send Invite"}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
      </div>

      {/* Members table */}
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No team members yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {member.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.avatar_url}
                            alt={member.full_name ?? ""}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(member.full_name ?? member.email)
                        )}
                      </div>
                      <span className="font-medium text-sm text-foreground">
                        {member.full_name ?? "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                        onClick={async () => {
                          await fetch(`/api/settings/team/${member.id}`, {
                            method: "DELETE",
                          });
                          setMembers((prev) => prev.filter((m) => m.id !== member.id));
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function NotificationsTab() {
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [emailCritical, setEmailCritical] = useState(true);
  const [emailHigh, setEmailHigh] = useState(true);
  const [emailMedium, setEmailMedium] = useState(false);
  const [emailLow, setEmailLow] = useState(false);
  const [emailDigest, setEmailDigest] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState<"daily" | "weekly">("weekly");
  const [userEmail, setUserEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [testingSlack, setTestingSlack] = useState(false);
  const [slackTestResult, setSlackTestResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    fetch("/api/settings/notifications")
      .then((r) => r.json())
      .then((data) => {
        setSlackWebhookUrl(data.slack_webhook_url ?? "");
        setEmailCritical(data.email_critical ?? true);
        setEmailHigh(data.email_high ?? true);
        setEmailMedium(data.email_medium ?? false);
        setEmailLow(data.email_low ?? false);
        setEmailDigest(data.email_digest ?? true);
        setDigestFrequency(data.digest_frequency ?? "weekly");
        setUserEmail(data.user_email ?? "");
        setFetched(true);
      })
      .catch(() => setFetched(true));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slack_webhook_url: slackWebhookUrl,
          email_critical: emailCritical,
          email_high: emailHigh,
          email_medium: emailMedium,
          email_low: emailLow,
          email_digest: emailDigest,
          digest_frequency: digestFrequency,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSlack = async () => {
    if (!slackWebhookUrl) return;
    setTestingSlack(true);
    setSlackTestResult(null);
    try {
      const res = await fetch("/api/settings/notifications/test-slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: slackWebhookUrl }),
      });
      setSlackTestResult(res.ok ? "success" : "error");
    } finally {
      setTestingSlack(false);
    }
  };

  if (!fetched) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure where and when you receive alerts
        </p>
      </div>

      {/* Slack */}
      <div className="space-y-3">
        <div>
          <Label className="text-base font-semibold">Slack Notifications</Label>
          <p className="text-sm text-muted-foreground mt-0.5">
            Receive health alerts directly in your Slack workspace
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://hooks.slack.com/services/..."
            value={slackWebhookUrl}
            onChange={(e) => setSlackWebhookUrl(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={handleTestSlack}
            disabled={testingSlack || !slackWebhookUrl}
            className="flex-shrink-0 gap-1.5"
          >
            {testingSlack ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Test
          </Button>
        </div>
        {slackTestResult === "success" && (
          <p className="text-sm text-green-600 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            Test message sent! Check your Slack channel.
          </p>
        )}
        {slackTestResult === "error" && (
          <p className="text-sm text-red-600 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Failed to send test message. Check your webhook URL.
          </p>
        )}
      </div>

      <Separator />

      {/* Email preferences */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Email Notifications</Label>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose which alert severities trigger email notifications
          </p>
        </div>

        <div className="space-y-3">
          {[
            { label: "Critical alerts", sublabel: "Score drops to critical, payment failures", checked: emailCritical, onChange: setEmailCritical },
            { label: "High severity alerts", sublabel: "Significant churn risk increases", checked: emailHigh, onChange: setEmailHigh },
            { label: "Medium severity alerts", sublabel: "Notable health score changes", checked: emailMedium, onChange: setEmailMedium },
            { label: "Low severity alerts", sublabel: "Informational notifications", checked: emailLow, onChange: setEmailLow },
          ].map(({ label, sublabel, checked, onChange }) => (
            <div key={label} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground">{sublabel}</div>
              </div>
              <Switch checked={checked} onCheckedChange={onChange} />
            </div>
          ))}
        </div>

        <Separator />

        {/* Email Digest */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">Email Digest</div>
              <div className="text-xs text-muted-foreground">
                Summary of health changes, alerts, and renewals
              </div>
            </div>
            <Switch checked={emailDigest} onCheckedChange={setEmailDigest} />
          </div>

          {emailDigest && (
            <>
              <div className="flex items-center gap-3 pl-1">
                <Label className="text-sm text-muted-foreground">Frequency:</Label>
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setDigestFrequency("daily")}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      digestFrequency === "daily"
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => setDigestFrequency("weekly")}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      digestFrequency === "weekly"
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Weekly
                  </button>
                </div>
              </div>
              {userEmail && (
                <p className="text-xs text-muted-foreground pl-1 flex items-center gap-1.5">
                  <Mail className="w-3 h-3" />
                  Email digest will be sent to {userEmail}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading} className="gap-1.5">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? "Saved!" : "Save Preferences"}
      </Button>
    </div>
  );
}

// ─── Activity Log ─────────────────────────────────────────────

interface AuditEntry {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  user?: { full_name?: string; email?: string } | null;
}

function formatAction(action: string): string {
  const labels: Record<string, string> = {
    "formula.updated": "Updated health score formula",
    "playbook.created": "Created playbook",
    "playbook.updated": "Updated playbook",
    "playbook.deleted": "Deleted playbook",
    "integration.connected": "Connected integration",
    "integration.disconnected": "Disconnected integration",
    "account.created": "Created account",
    "account.deleted": "Deleted account",
    "account.exported": "Exported organization data",
    "account.deletion_requested": "Requested account deletion",
  };
  return labels[action] ?? action;
}

function ActivityLogTab() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    fetch("/api/settings/audit-log")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries ?? []);
        setFetched(true);
      })
      .catch(() => setFetched(true));
  }, []);

  if (!fetched) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Activity Log</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Recent actions performed in your organization
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const user = Array.isArray(entry.user) ? entry.user[0] : entry.user;
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium text-sm">
                      {formatAction(entry.action)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user?.full_name ?? user?.email ?? "System"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {Object.keys(entry.details).length > 0
                        ? Object.entries(entry.details)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your account, organization, and preferences
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="organization" className="gap-1.5">
            <Building2 className="w-4 h-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5">
            <CreditCard className="w-4 h-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="w-4 h-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            <ScrollText className="w-4 h-4" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="bg-white rounded-xl border border-border p-6">
            <ProfileTab />
          </div>
        </TabsContent>

        <TabsContent value="organization">
          <div className="bg-white rounded-xl border border-border p-6">
            <OrganizationTab />
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <div className="bg-white rounded-xl border border-border p-6">
            <BillingTab />
          </div>
        </TabsContent>

        <TabsContent value="team">
          <div className="bg-white rounded-xl border border-border p-6">
            <TeamTab />
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="bg-white rounded-xl border border-border p-6">
            <NotificationsTab />
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="bg-white rounded-xl border border-border p-6">
            <ActivityLogTab />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
