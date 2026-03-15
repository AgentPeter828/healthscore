"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PLAYBOOK_TEMPLATES } from "@/lib/ai-presets";
import { Sparkles, Loader2, CheckCircle, Zap, ChevronRight } from "lucide-react";

export function PlaybookTemplates() {
  const [installing, setInstalling] = useState<string | null>(null);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const router = useRouter();

  async function installTemplate(templateId: string) {
    const template = PLAYBOOK_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    setInstalling(templateId);
    try {
      const res = await fetch("/api/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          trigger_type: template.trigger_type,
          trigger_config: template.trigger_config,
          conditions: template.conditions,
          actions: template.actions,
          is_active: true,
        }),
      });

      if (res.ok || res.status === 403) {
        setInstalled((prev) => new Set([...prev, templateId]));
        router.refresh();
      }
    } finally {
      setInstalling(null);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <h3 className="font-semibold text-foreground">Playbook Templates</h3>
        <span className="text-xs text-muted-foreground">One-click install</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PLAYBOOK_TEMPLATES.map((template) => {
          const isInstalled = installed.has(template.id);
          const isInstalling = installing === template.id;

          return (
            <div
              key={template.id}
              className="border border-border rounded-lg p-4 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-foreground">{template.name}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  {template.actions.map((a, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight className="w-3 h-3" />}
                      <span className="capitalize">{a.action_type.replace("_", " ")}</span>
                    </span>
                  ))}
                </div>
              </div>
              <Button
                size="sm"
                variant={isInstalled ? "outline" : "default"}
                className="cursor-pointer flex-shrink-0"
                onClick={() => installTemplate(template.id)}
                disabled={isInstalling || isInstalled}
              >
                {isInstalling ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : isInstalled ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Added
                  </>
                ) : (
                  "Install"
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
