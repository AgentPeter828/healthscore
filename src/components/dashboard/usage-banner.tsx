"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface UsageBannerProps {
  label: string;
  current: number;
  limit: number; // -1 = unlimited
}

export function UsageBanner({ label, current, limit }: UsageBannerProps) {
  if (limit === -1) return null;

  const pct = limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0;
  const color =
    pct >= 90 ? "red" : pct >= 70 ? "amber" : "green";

  const barColor =
    color === "red"
      ? "bg-red-500"
      : color === "amber"
      ? "bg-amber-500"
      : "bg-green-500";

  const textColor =
    color === "red"
      ? "text-red-700"
      : color === "amber"
      ? "text-amber-700"
      : "text-green-700";

  const bgColor =
    color === "red"
      ? "bg-red-50 border-red-200"
      : color === "amber"
      ? "bg-amber-50 border-amber-200"
      : "bg-green-50 border-green-200";

  return (
    <div className={cn("rounded-lg border px-4 py-3 flex items-center gap-4", bgColor)}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className={cn("font-medium", textColor)}>
            {label}: {current.toLocaleString()} / {limit.toLocaleString()}
          </span>
          <span className={cn("text-xs", textColor)}>{pct}%</span>
        </div>
        <div className="w-full h-2 bg-white/70 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {pct >= 70 && (
        <Link
          href="/dashboard/billing"
          className="cursor-pointer flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-white border border-blue-200 rounded-md px-3 py-1.5 flex-shrink-0 transition-colors"
        >
          <TrendingUp className="w-3 h-3" />
          Upgrade
        </Link>
      )}
    </div>
  );
}
