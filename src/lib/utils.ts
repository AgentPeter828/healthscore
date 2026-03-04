import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Score → color mapping
export function getScoreColor(score: number): string {
  if (score >= 70) return "text-health-green";
  if (score >= 40) return "text-health-yellow";
  return "text-health-red";
}

export function getScoreBg(score: number): string {
  if (score >= 70) return "bg-health-green-bg text-green-800";
  if (score >= 40) return "bg-health-yellow-bg text-yellow-800";
  return "bg-health-red-bg text-red-800";
}

export function getScoreLabel(score: number): string {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "At Risk";
  return "Critical";
}

export function getSegmentColor(segment: string): string {
  switch (segment) {
    case "green":
      return "text-health-green";
    case "yellow":
      return "text-health-yellow";
    case "red":
      return "text-health-red";
    default:
      return "text-muted-foreground";
  }
}

export function getSegmentBadgeClass(segment: string): string {
  switch (segment) {
    case "green":
      return "bg-green-100 text-green-800 border-green-200";
    case "yellow":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "red":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export function getChurnRiskColor(label: string): string {
  switch (label) {
    case "low":
      return "text-health-green";
    case "medium":
      return "text-health-yellow";
    case "high":
      return "text-orange-500";
    case "critical":
      return "text-health-red";
    default:
      return "text-muted-foreground";
  }
}

// Format currency
export function formatMRR(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatCurrency(
  value: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Format dates
export function formatDate(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatRelativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getDaysUntil(date: string | Date): number {
  return differenceInDays(new Date(date), new Date());
}

export function getRenewalUrgency(date: string | Date): string {
  const days = getDaysUntil(date);
  if (days < 0) return "overdue";
  if (days <= 7) return "critical";
  if (days <= 30) return "soon";
  if (days <= 90) return "upcoming";
  return "future";
}

// Generate webhook URL for an integration
export function getWebhookUrl(integrationId: string, secret: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://healthscore.app";
  return `${baseUrl}/api/webhooks/${integrationId}?secret=${secret}`;
}

// Slugify org name
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Calculate health score from components
export interface ScoreComponents {
  usage_score?: number;
  support_score?: number;
  billing_score?: number;
  engagement_score?: number;
  nps_score?: number;
  feature_adoption_score?: number;
}

export interface FormulaComponent {
  key: string;
  weight: number;
  enabled: boolean;
}

export function calculateWeightedScore(
  components: ScoreComponents,
  formula: FormulaComponent[]
): number {
  const enabledComponents = formula.filter((c) => c.enabled);
  if (enabledComponents.length === 0) return 0;

  const totalWeight = enabledComponents.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;

  let weightedSum = 0;
  for (const component of enabledComponents) {
    const score = components[component.key as keyof ScoreComponents] ?? 50;
    weightedSum += score * (component.weight / totalWeight);
  }

  return Math.round(Math.max(0, Math.min(100, weightedSum)));
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Validate email
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
