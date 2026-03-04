"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Integration, IntegrationType } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  Copy,
  CheckCheck,
  Loader2,
  ExternalLink,
  Zap,
} from "lucide-react";

interface SetupStep {
  title: string;
  description: string;
}

interface IntegrationCardProps {
  type: IntegrationType;
  name: string;
  category: string;
  description: string;
  setupSteps: SetupStep[];
  planRequired?: string;
  integration?: Integration | null;
}

function getWebhookUrl(integrationId: string, secret: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://healthscore.app";
  return `${base}/api/webhooks/${integrationId}?secret=${secret}`;
}

export function IntegrationCard({
  type,
  name,
  category,
  description,
  setupSteps,
  planRequired,
  integration,
}: IntegrationCardProps) {
  const isConnected = !!integration;
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [enabled, setEnabled] = useState(integration?.is_active ?? false);
  const [togglingEnabled, setTogglingEnabled] = useState(false);

  const webhookUrl =
    integration
      ? getWebhookUrl(integration.id, integration.webhook_secret)
      : null;

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!webhookUrl) return;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  };

  const handleToggle = async (value: boolean) => {
    if (!integration) return;
    setTogglingEnabled(true);
    try {
      const res = await fetch(`/api/integrations/${integration.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: value }),
      });
      if (res.ok) {
        setEnabled(value);
      }
    } finally {
      setTogglingEnabled(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border flex flex-col">
      {/* Card header */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-foreground">{name}</h3>
              <Badge variant="outline" className="text-xs">
                {category}
              </Badge>
              {planRequired && (
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  {planRequired}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {/* Status + toggle */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <Badge
              variant="outline"
              className={
                isConnected
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }
            >
              {isConnected ? "Connected" : "Not Connected"}
            </Badge>
            {isConnected && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  {enabled ? "Enabled" : "Disabled"}
                </span>
                <Switch
                  checked={enabled}
                  onCheckedChange={handleToggle}
                  disabled={togglingEnabled}
                />
              </div>
            )}
          </div>
        </div>

        {/* Connected details */}
        {isConnected && integration && (
          <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Events received</span>
              <span className="font-medium text-foreground">{integration.event_count.toLocaleString()}</span>
            </div>
            {integration.last_event_at && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Last event</span>
                <span className="font-medium text-foreground">
                  {formatDate(integration.last_event_at)}
                </span>
              </div>
            )}

            {/* Webhook URL */}
            {webhookUrl && (
              <div className="mt-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">Webhook URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white border border-slate-200 rounded px-2 py-1.5 truncate font-mono text-slate-700">
                    {webhookUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="flex-shrink-0 px-2"
                  >
                    {copied ? (
                      <CheckCheck className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-5">
        <div className="flex items-center gap-2">
          {!isConnected ? (
            <Button
              size="sm"
              onClick={handleConnect}
              disabled={loading}
              className="gap-1.5"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              {loading ? "Connecting..." : "Connect"}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? (
                <CheckCheck className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Copied!" : "Copy Webhook URL"}
            </Button>
          )}
        </div>

        {/* Setup instructions accordion */}
        <Accordion type="single" collapsible className="mt-3">
          <AccordionItem value="setup" className="border-0">
            <AccordionTrigger className="text-xs text-muted-foreground hover:text-foreground py-2 hover:no-underline">
              <span className="flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Setup Instructions
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="space-y-2 mt-1">
                {setupSteps.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <span className="font-medium text-foreground">{step.title}</span>
                      {step.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
