import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "HealthScore pricing: Free ($0, 25 accounts), Starter ($49/mo), Growth ($99/mo), Scale ($199/mo). No credit card required. No sales call. No annual contract.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
