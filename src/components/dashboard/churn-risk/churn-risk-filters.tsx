"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

const RISK_FILTERS = [
  { label: "All", value: "" },
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
] as const;

interface Props {
  currentRisk: string;
}

export function ChurnRiskFilters({ currentRisk }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleFilter(value: string) {
    startTransition(() => {
      if (value) {
        router.push(`${pathname}?risk=${value}`);
      } else {
        router.push(pathname);
      }
    });
  }

  const buttonStyle = (value: string) => {
    const isActive = currentRisk === value;
    if (!isActive) {
      return "bg-white border-border text-muted-foreground hover:bg-slate-50";
    }
    switch (value) {
      case "critical":
        return "bg-red-100 border-red-300 text-red-800";
      case "high":
        return "bg-orange-100 border-orange-300 text-orange-800";
      case "medium":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "low":
        return "bg-green-100 border-green-300 text-green-800";
      default:
        return "bg-slate-800 border-slate-800 text-white";
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 flex-wrap",
        isPending && "opacity-70 pointer-events-none"
      )}
    >
      <span className="text-sm text-muted-foreground mr-1">Filter by risk:</span>
      {RISK_FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => handleFilter(f.value)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
            buttonStyle(f.value)
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
