"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";

export function RunAIAnalysisButton() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setStatus("idle");
    setMessage(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/ai/predict-churn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setStatus("error");
          setMessage(body.error ?? "Analysis failed. Please try again.");
          return;
        }

        const body = await res.json();
        setStatus("success");
        setMessage(
          body.message ??
            `Analysis complete. ${body.accounts_processed ?? ""} accounts scored.`
        );

        // Refresh server data
        router.refresh();

        // Reset success state after a few seconds
        setTimeout(() => {
          setStatus("idle");
          setMessage(null);
        }, 4000);
      } catch {
        setStatus("error");
        setMessage("Network error. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={handleClick}
        disabled={isPending}
        size="sm"
        className="gap-2"
        variant={status === "success" ? "outline" : "default"}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing...
          </>
        ) : status === "success" ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Analysis Complete
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Run AI Analysis
          </>
        )}
      </Button>

      {message && (
        <p
          className={`text-xs ${
            status === "error" ? "text-red-600" : "text-green-600"
          } max-w-xs text-right`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
