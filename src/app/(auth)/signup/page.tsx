"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Activity, Chrome, CheckCircle } from "lucide-react";

const PLAN_NAMES: Record<string, string> = {
  starter: "Starter ($49/mo)",
  growth: "Growth ($99/mo)",
  scale: "Scale ($199/mo)",
};

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!fullName.trim()) {
      setError("Full name is required");
      setLoading(false);
      return;
    }

    if (!orgName.trim()) {
      setError("Company name is required");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          org_name: orgName,
          plan: planParam || "free",
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=/dashboard/onboarding`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  async function handleGoogleSignup() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=/dashboard/onboarding`,
      },
    });
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-gray-900 font-bold text-xl">HealthScore</span>
          </div>
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardContent className="pt-8 pb-8 space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
              <p className="text-gray-500">
                We sent a confirmation link to{" "}
                <strong className="text-gray-900">{email}</strong>. Click it to
                activate your account and get started.
              </p>
              <p className="text-gray-400 text-sm">
                Didn&apos;t get it? Check your spam folder.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-gray-900 font-bold text-xl">HealthScore</span>
        </div>

        {planParam && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center text-blue-700 text-sm">
            You selected: <strong>{PLAN_NAMES[planParam] || planParam}</strong>
            {" — "}you can update billing after signup.
          </div>
        )}

        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-gray-900">
              Start for free
            </CardTitle>
            <CardDescription className="text-gray-500">
              Set up customer health scoring in 5 minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50 text-red-700 text-sm p-3">
                {error}
              </Alert>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <Chrome className="w-4 h-4" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or sign up with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">
                    Full name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Jane Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org" className="text-gray-700">
                    Company name
                  </Label>
                  <Input
                    id="org"
                    type="text"
                    placeholder="Acme Corp"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Work email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="8+ characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create free account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500 w-full text-center">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
          <span>✓ No credit card required</span>
          <span>✓ Free forever plan</span>
          <span>✓ Cancel anytime</span>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-600">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-gray-600">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
