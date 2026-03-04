"use client";

import { useMemo } from "react";
import { Renewal, SegmentColor } from "@/lib/types";
// formatDate and getSegmentBadgeClass available from "@/lib/utils" if needed
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RenewalWithAccount extends Omit<Renewal, "account"> {
  account?: { id: string; name: string; segment: SegmentColor } | null;
}

interface RenewalsCalendarProps {
  renewals: RenewalWithAccount[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getSegmentDotColor(segment: string): string {
  switch (segment) {
    case "green":
      return "bg-green-500";
    case "yellow":
      return "bg-yellow-500";
    case "red":
      return "bg-red-500";
    default:
      return "bg-slate-400";
  }
}

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function MonthCalendar({
  year,
  month,
  renewalsByDay,
}: {
  year: number;
  month: number;
  renewalsByDay: Map<string, RenewalWithAccount[]>;
}) {
  const days = buildCalendarDays(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <h3 className="font-semibold text-foreground text-sm mb-3">
        {MONTH_NAMES[month]} {year}
      </h3>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-px">
        {days.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="h-14" />;
          }

          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayRenewals = renewalsByDay.get(key) ?? [];
          const isToday =
            isCurrentMonth && today.getDate() === day;

          return (
            <div
              key={key}
              className={`h-14 rounded-lg p-1 flex flex-col ${
                isToday ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50"
              }`}
            >
              <span
                className={`text-xs font-medium leading-none mb-1 ${
                  isToday ? "text-blue-700" : "text-muted-foreground"
                }`}
              >
                {day}
              </span>

              {/* Renewal dots */}
              <div className="flex flex-wrap gap-0.5 overflow-hidden">
                {dayRenewals.slice(0, 4).map((renewal) => {
                  const acct = Array.isArray(renewal.account)
                    ? renewal.account[0]
                    : renewal.account;
                  const segment = acct?.segment ?? "green";
                  const name = acct?.name ?? "Account";

                  return (
                    <TooltipProvider key={renewal.id} delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={`/dashboard/renewals`}>
                            <span
                              className={`block w-2 h-2 rounded-full ${getSegmentDotColor(segment)} cursor-pointer hover:scale-125 transition-transform`}
                            />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-[160px]">
                          <div className="font-medium">{name}</div>
                          <div className="text-muted-foreground capitalize">{segment} segment</div>
                          {renewal.contract_value && (
                            <div>${renewal.contract_value.toLocaleString()}</div>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
                {dayRenewals.length > 4 && (
                  <span className="text-xs text-muted-foreground">+{dayRenewals.length - 4}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RenewalsCalendar({ renewals }: RenewalsCalendarProps) {
  const today = new Date();

  // Build 3 months: current, next, the one after
  const months = useMemo(() => {
    const result = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      result.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Index renewals by date key YYYY-MM-DD
  const renewalsByDay = useMemo(() => {
    const map = new Map<string, RenewalWithAccount[]>();
    for (const renewal of renewals) {
      const key = renewal.renewal_date.split("T")[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(renewal);
    }
    return map;
  }, [renewals]);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Segment legend:</span>
        {(["green", "yellow", "red"] as SegmentColor[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5 capitalize">
            <span className={`w-2.5 h-2.5 rounded-full ${getSegmentDotColor(s)}`} />
            {s}
          </span>
        ))}
      </div>

      {/* 3-month grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {months.map(({ year, month }) => (
          <MonthCalendar
            key={`${year}-${month}`}
            year={year}
            month={month}
            renewalsByDay={renewalsByDay}
          />
        ))}
      </div>
    </div>
  );
}
