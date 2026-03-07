"use client";

import { DashboardErrorBoundary } from "@/components/dashboard/error-boundary";

export default function IntegrationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DashboardErrorBoundary error={error} reset={reset} />;
}
