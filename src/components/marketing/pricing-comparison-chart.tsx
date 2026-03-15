"use client";

import { cn } from "@/lib/utils";

const competitors = [
  { name: "HealthScore", price: 99, color: "bg-blue-600", label: "$49–$199 USD/mo" },
  { name: "Custify", price: 999, color: "bg-gray-400", label: "$999+ USD/mo" },
  { name: "ChurnZero", price: 1500, color: "bg-gray-400", label: "$1,500+ USD/mo" },
  { name: "Gainsight", price: 2500, color: "bg-gray-400", label: "$2,500+ USD/mo" },
];

const maxPrice = 2500;

export function PricingComparisonChart() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 text-center">
        How we compare on price
      </h3>
      <p className="text-sm text-gray-500 text-center">
        All prices in USD. Competitor pricing based on publicly available data.
      </p>
      <div className="space-y-3 max-w-2xl mx-auto">
        {competitors.map((c) => {
          const widthPct = Math.max(4, (c.price / maxPrice) * 100);
          return (
            <div key={c.name} className="flex items-center gap-3">
              <div className="w-24 text-right text-sm font-medium text-gray-700 flex-shrink-0">
                {c.name}
              </div>
              <div className="flex-1">
                <div
                  className={cn(
                    "h-8 rounded-md flex items-center px-3 transition-all",
                    c.color
                  )}
                  style={{ width: `${widthPct}%` }}
                >
                  <span className="text-xs font-semibold text-white whitespace-nowrap">
                    {c.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
