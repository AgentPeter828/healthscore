import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: {
    default: "HealthScore — Customer Health Scoring for SaaS",
    template: "%s | HealthScore",
  },
  description:
    "Know which customers are about to churn — before they do. HealthScore gives you instant visibility into every account. Connect your data, get health scores, stop churn.",
  keywords: [
    "customer health score",
    "churn prediction",
    "customer success",
    "saas metrics",
    "account health",
  ],
  authors: [{ name: "Project Firestorm Pty Ltd" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://healthscore.app",
    siteName: "HealthScore",
    title: "HealthScore — Stop Churn Before It Happens",
    description:
      "Customer health scoring that actually works. Setup in 5 minutes.",
  },
  twitter: {
    card: "summary_large_image",
    title: "HealthScore — Stop Churn Before It Happens",
    description: "Customer health scoring that actually works.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
