"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const SEGMENT_FILTERS = [
  { label: "All", value: "" },
  { label: "Healthy", value: "green" },
  { label: "At Risk", value: "yellow" },
  { label: "Critical", value: "red" },
] as const;

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Active", value: "active" },
  { label: "Trial", value: "trial" },
  { label: "Paused", value: "paused" },
  { label: "Churned", value: "churned" },
] as const;

export function AccountsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSegment = searchParams.get("segment") ?? "";
  const currentStatus = searchParams.get("status") ?? "";
  const currentSearch = searchParams.get("search") ?? "";

  const createQueryString = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset to page 1 on filter change
      params.delete("page");
      return params.toString();
    },
    [searchParams]
  );

  const handleSearch = useCallback(
    (value: string) => {
      startTransition(() => {
        router.push(`${pathname}?${createQueryString({ search: value })}`);
      });
    },
    [router, pathname, createQueryString]
  );

  const handleSegment = useCallback(
    (value: string) => {
      startTransition(() => {
        router.push(`${pathname}?${createQueryString({ segment: value })}`);
      });
    },
    [router, pathname, createQueryString]
  );

  const handleStatus = useCallback(
    (value: string) => {
      startTransition(() => {
        router.push(`${pathname}?${createQueryString({ status: value })}`);
      });
    },
    [router, pathname, createQueryString]
  );

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row gap-3 items-start sm:items-center",
        isPending && "opacity-70 pointer-events-none"
      )}
    >
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search accounts..."
          defaultValue={currentSearch}
          onChange={(e) => {
            const val = e.target.value;
            // Debounce via native timeout
            const id = setTimeout(() => handleSearch(val), 400);
            return () => clearTimeout(id);
          }}
          className="pl-9 h-9 text-sm bg-white"
        />
      </div>

      {/* Segment filter pills */}
      <div className="flex items-center gap-1.5">
        {SEGMENT_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleSegment(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
              currentSegment === f.value
                ? f.value === "green"
                  ? "bg-green-100 border-green-300 text-green-800"
                  : f.value === "yellow"
                  ? "bg-yellow-100 border-yellow-300 text-yellow-800"
                  : f.value === "red"
                  ? "bg-red-100 border-red-300 text-red-800"
                  : "bg-slate-800 border-slate-800 text-white"
                : "bg-white border-border text-muted-foreground hover:bg-slate-50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Status select */}
      <select
        value={currentStatus}
        onChange={(e) => handleStatus(e.target.value)}
        className="h-9 px-3 pr-8 rounded-md border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
