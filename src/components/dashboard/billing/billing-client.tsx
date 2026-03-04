"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";

interface BillingClientProps {
  currentPlan: string;
  targetPlan?: string;
  hasStripeCustomer?: boolean;
  compact?: boolean;
}

export function BillingClient({
  currentPlan,
  targetPlan,
  hasStripeCustomer,
  compact = false,
}: BillingClientProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  async function handleManage() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  // Current plan management button
  if (!targetPlan) {
    if (currentPlan === "free" || !hasStripeCustomer) return null;
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleManage}
        disabled={loading}
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
        Manage Billing
      </Button>
    );
  }

  // Upgrade button for a specific plan
  return (
    <Button
      className={`${compact ? "w-full mt-4" : ""} bg-blue-600 hover:bg-blue-500 text-white`}
      size={compact ? "sm" : "default"}
      onClick={handleUpgrade}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : null}
      Upgrade
    </Button>
  );
}
