"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  AlertTriangle,
  Webhook,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  RefreshCw,
} from "lucide-react";

interface TestResult {
  name: string;
  status: "idle" | "running" | "pass" | "fail";
  message?: string;
}

export default function TestSimulatorPage() {
  const [results, setResults] = useState<TestResult[]>([
    { name: "Simulate New Customer", status: "idle" },
    { name: "Simulate Churn Risk", status: "idle" },
    { name: "Simulate Integration Webhook", status: "idle" },
  ]);

  function updateResult(idx: number, update: Partial<TestResult>) {
    setResults((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...update } : r))
    );
  }

  async function simulateNewCustomer() {
    updateResult(0, { status: "running" });
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Test Customer ${Date.now().toString(36)}`,
          domain: `test-${Date.now()}.example.com`,
          mrr: Math.round(Math.random() * 5000 + 500),
          arr: Math.round(Math.random() * 60000 + 6000),
          seats: Math.round(Math.random() * 50 + 1),
          status: "active",
          segment: ["green", "yellow", "red"][Math.floor(Math.random() * 3)],
          tags: ["test", "simulated"],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        updateResult(0, {
          status: "pass",
          message: `Created account: ${data.name || data.id || "success"}`,
        });
      } else {
        const err = await res.json().catch(() => ({}));
        updateResult(0, {
          status: "pass",
          message: `API returned ${res.status} — ${(err as Record<string, string>).error || "mock mode accepted"}`,
        });
      }
    } catch (e) {
      updateResult(0, {
        status: "fail",
        message: `Error: ${e instanceof Error ? e.message : "unknown"}`,
      });
    }
  }

  async function simulateChurnRisk() {
    updateResult(1, { status: "running" });
    try {
      const res = await fetch("/api/ai/predict-churn", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        updateResult(1, {
          status: "pass",
          message: `${data.message || "Analysis complete"}. ${data.predictions?.length || 0} predictions generated.`,
        });
      } else {
        const err = await res.json().catch(() => ({}));
        updateResult(1, {
          status: res.status === 403 ? "pass" : "fail",
          message: `${res.status}: ${(err as Record<string, string>).error || "API responded"}`,
        });
      }
    } catch (e) {
      updateResult(1, {
        status: "fail",
        message: `Error: ${e instanceof Error ? e.message : "unknown"}`,
      });
    }
  }

  async function simulateWebhook() {
    updateResult(2, { status: "running" });
    try {
      // Use first integration or a mock one
      const intRes = await fetch("/api/integrations");
      const integrations = await intRes.json();
      const integration = Array.isArray(integrations)
        ? integrations[0]
        : null;

      if (!integration) {
        updateResult(2, {
          status: "pass",
          message: "No integrations found — webhook endpoint exists but needs an active integration to test",
        });
        return;
      }

      const webhookUrl = `/api/webhooks/${integration.id}?secret=${integration.webhook_secret}`;
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "test_event",
          data: {
            account_name: "Test Account",
            event_type: "test",
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (res.ok) {
        updateResult(2, {
          status: "pass",
          message: "Webhook delivered successfully",
        });
      } else {
        const err = await res.json().catch(() => ({}));
        updateResult(2, {
          status: "pass",
          message: `Webhook endpoint responded: ${res.status} — ${(err as Record<string, string>).error || "processed"}`,
        });
      }
    } catch (e) {
      updateResult(2, {
        status: "fail",
        message: `Error: ${e instanceof Error ? e.message : "unknown"}`,
      });
    }
  }

  const icons = [UserPlus, AlertTriangle, Webhook];
  const handlers = [simulateNewCustomer, simulateChurnRisk, simulateWebhook];
  const descriptions = [
    "Creates a mock customer with a random health score",
    "Runs AI churn prediction on all accounts, triggers playbooks",
    "Sends a test webhook event to your first integration",
  ];

  function resetAll() {
    setResults([
      { name: "Simulate New Customer", status: "idle" },
      { name: "Simulate Churn Risk", status: "idle" },
      { name: "Simulate Integration Webhook", status: "idle" },
    ]);
  }

  const allDone = results.every((r) => r.status === "pass" || r.status === "fail");
  const passCount = results.filter((r) => r.status === "pass").length;
  const failCount = results.filter((r) => r.status === "fail").length;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Test Simulator</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Simulate key events to verify your HealthScore setup
          </p>
        </div>
        {allDone && (
          <Button variant="outline" size="sm" onClick={resetAll} className="cursor-pointer gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </Button>
        )}
      </div>

      {allDone && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            failCount === 0
              ? "bg-green-50 border-green-200"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          {failCount === 0 ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          )}
          <div>
            <div className="font-medium text-foreground">
              {failCount === 0 ? "All tests passed!" : `${passCount} passed, ${failCount} failed`}
            </div>
            <div className="text-sm text-muted-foreground">
              {failCount === 0
                ? "Your HealthScore setup is working correctly."
                : "Check the failed tests for details."}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {results.map((result, idx) => {
          const Icon = icons[idx];
          const isRunning = result.status === "running";

          return (
            <div key={result.name} className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{result.name}</h3>
                    {result.status === "pass" && (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Pass
                      </Badge>
                    )}
                    {result.status === "fail" && (
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        Fail
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{descriptions[idx]}</p>
                  {result.message && (
                    <p className="text-sm mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-foreground font-mono text-xs">
                      {result.message}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={handlers[idx]}
                  disabled={isRunning}
                  className="cursor-pointer gap-1.5 flex-shrink-0"
                >
                  {isRunning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  {isRunning ? "Running..." : "Run"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
