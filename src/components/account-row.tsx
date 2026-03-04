"use client";

import * as React from "react";
import { MoreHorizontal, Eye, ExternalLink, UserCircle2 } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { cn, formatMRR, getInitials } from "@/lib/utils";
import type { Account } from "@/lib/types";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HealthScoreBadge } from "@/components/health-score-badge";

interface Props {
  account: Account;
  onView?: (id: string) => void;
}

// --- Renewal urgency helpers ---

function getRenewalDays(renewalDate: string): number {
  try {
    return differenceInDays(parseISO(renewalDate), new Date());
  } catch {
    return 999;
  }
}

function formatRenewalDate(renewalDate: string): string {
  try {
    return format(parseISO(renewalDate), "MMM d, yyyy");
  } catch {
    return renewalDate;
  }
}

function getRenewalBadgeVariant(
  days: number
): "red" | "yellow" | "secondary" | "outline" {
  if (days < 0) return "red";
  if (days <= 7) return "red";
  if (days <= 30) return "yellow";
  if (days <= 90) return "secondary";
  return "outline";
}

function getRenewalLabel(days: number, date: string): string {
  if (days < 0) return `Overdue (${formatRenewalDate(date)})`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `${days}d (${formatRenewalDate(date)})`;
  if (days <= 30) return `${days}d (${formatRenewalDate(date)})`;
  return formatRenewalDate(date);
}

// --- Churn risk helpers ---

function getChurnRiskVariant(
  label: string
): "red" | "yellow" | "green" | "secondary" {
  switch (label) {
    case "critical":
      return "red";
    case "high":
      return "red";
    case "medium":
      return "yellow";
    case "low":
      return "green";
    default:
      return "secondary";
  }
}

function capitalizeFirst(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Segment badge ---

function getSegmentVariant(
  segment: string
): "green" | "yellow" | "red" | "secondary" {
  switch (segment) {
    case "green":
      return "green";
    case "yellow":
      return "yellow";
    case "red":
      return "red";
    default:
      return "secondary";
  }
}

// --- Component ---

export function AccountRow({ account, onView }: Props) {
  const score = account.health_score?.overall_score ?? 0;
  const churnRisk = account.health_score?.churn_risk_label ?? "low";

  const renewalDays = account.renewal_date
    ? getRenewalDays(account.renewal_date)
    : null;

  const renewalVariant =
    renewalDays !== null ? getRenewalBadgeVariant(renewalDays) : "outline";

  const renewalLabel =
    account.renewal_date && renewalDays !== null
      ? getRenewalLabel(renewalDays, account.renewal_date)
      : "—";

  const csmName = account.csm?.full_name ?? "Unassigned";
  const csmInitials = account.csm?.full_name
    ? getInitials(account.csm.full_name)
    : "??";

  const domainDisplay = account.domain
    ? account.domain.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : null;

  return (
    <TableRow className="group">
      {/* Account name + domain */}
      <TableCell className="min-w-[200px]">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onView?.(account.id)}
            className="text-left text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {account.name}
          </button>
          {domainDisplay && (
            <span className="text-xs text-muted-foreground">{domainDisplay}</span>
          )}
        </div>
      </TableCell>

      {/* Health score */}
      <TableCell className="w-[90px]">
        <HealthScoreBadge score={score} size="sm" />
      </TableCell>

      {/* Segment */}
      <TableCell className="w-[100px]">
        <Badge variant={getSegmentVariant(account.segment)}>
          {capitalizeFirst(account.segment)}
        </Badge>
      </TableCell>

      {/* MRR */}
      <TableCell className="w-[100px]">
        <span className="text-sm font-medium tabular-nums">
          {formatMRR(account.mrr)}
        </span>
        <span className="text-xs text-muted-foreground">/mo</span>
      </TableCell>

      {/* Renewal date */}
      <TableCell className="w-[160px]">
        {account.renewal_date ? (
          <Badge variant={renewalVariant} className="whitespace-nowrap">
            {renewalLabel}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Churn risk */}
      <TableCell className="w-[100px]">
        <Badge variant={getChurnRiskVariant(churnRisk)}>
          {capitalizeFirst(churnRisk)}
        </Badge>
      </TableCell>

      {/* CSM */}
      <TableCell className="w-[160px]">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6 shrink-0">
            {account.csm?.avatar_url && (
              <AvatarImage
                src={account.csm.avatar_url}
                alt={csmName}
              />
            )}
            <AvatarFallback className="text-[10px]">{csmInitials}</AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "text-sm truncate max-w-[110px]",
              account.csm ? "text-foreground" : "text-muted-foreground italic"
            )}
          >
            {csmName}
          </span>
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell className="w-[60px] text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
              aria-label={`Actions for ${account.name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onView?.(account.id)}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Account
            </DropdownMenuItem>
            {account.domain && (
              <DropdownMenuItem asChild>
                <a
                  href={
                    account.domain.startsWith("http")
                      ? account.domain
                      : `https://${account.domain}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit Website
                </a>
              </DropdownMenuItem>
            )}
            {account.csm_id && (
              <DropdownMenuItem className="cursor-pointer">
                <UserCircle2 className="mr-2 h-4 w-4" />
                View CSM Profile
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
