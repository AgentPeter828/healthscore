import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface PricingDisclosureProps {
  competitorName: string;
  sourceUrl: string;
  dateVerified: string; // "March 2025"
}

export function PricingDisclosure({
  competitorName,
  sourceUrl,
  dateVerified,
}: PricingDisclosureProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <p>
        {competitorName} pricing sourced from{" "}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-amber-900"
        >
          {sourceUrl}
        </a>{" "}
        on {dateVerified}. Pricing and features subject to change. Check the{" "}
        {competitorName} website for current pricing.
      </p>
    </div>
  );
}
