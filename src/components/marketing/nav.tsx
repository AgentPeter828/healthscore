"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const alternatives = [
  { name: "vs Custify", href: "/alternative-to-custify" },
  { name: "vs ChurnZero", href: "/alternative-to-churnzero" },
  { name: "vs Gainsight", href: "/alternative-to-gainsight" },
];

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [altOpen, setAltOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsAuthed(true);
        setUserName(data.user.user_metadata?.full_name || data.user.email || null);
      }
    });
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="cursor-pointer flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HealthScore
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {!isAuthed && (
              <Link
                href="/demo"
                className="cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Demo
              </Link>
            )}
            <Link
              href="/features"
              className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </Link>

            {/* Alternatives dropdown */}
            <div className="relative">
              <button
                onClick={() => setAltOpen(!altOpen)}
                onBlur={() => setTimeout(() => setAltOpen(false), 150)}
                className="cursor-pointer flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Alternatives
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    altOpen && "rotate-180"
                  )}
                />
              </button>
              {altOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {alternatives.map((alt) => (
                    <Link
                      key={alt.href}
                      href={alt.href}
                      className="cursor-pointer block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      {alt.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthed ? (
              <>
                {userName && (
                  <span className="text-sm text-gray-500">{userName}</span>
                )}
                <Link
                  href="/dashboard"
                  className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
            {!isAuthed && (
              <Link
                href="/demo"
                className="cursor-pointer block py-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                onClick={() => setMobileOpen(false)}
              >
                Demo
              </Link>
            )}
            <Link
              href="/features"
              className="cursor-pointer block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              onClick={() => setMobileOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="cursor-pointer block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
            <div className="py-1">
              <p className="py-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Alternatives
              </p>
              {alternatives.map((alt) => (
                <Link
                  key={alt.href}
                  href={alt.href}
                  className="block py-2 pl-2 text-sm text-gray-700 hover:text-gray-900"
                  onClick={() => setMobileOpen(false)}
                >
                  {alt.name}
                </Link>
              ))}
            </div>
            <div className="pt-2 flex flex-col gap-2 border-t border-gray-100">
              {isAuthed ? (
                <Link
                  href="/dashboard"
                  className="cursor-pointer block rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="cursor-pointer block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="cursor-pointer block rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
