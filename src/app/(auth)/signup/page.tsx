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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">HealthScore</span>
          </div>
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="pt-8 pb-8 space-y-4">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">Check your email</h2>
              <p className="text-slate-400">
                We sent a confirmation link to{" "}
                <strong className="text-white">{email}</strong>. Click it to
                activate your account and get started.
              </p>
              <p className="text-slate-500 text-sm">
                Didn&apos;t get it? Check your spam folder.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">HealthScore</span>
        </div>

        {planParam && (
          <div className="mb-4 p-3 bg-blue-950 border border-blue-800 rounded-lg text-center text-blue-300 text-sm">
            You selected: <strong>{PLAN_NAMES[planParam] || planParam}</strong>
            {" — "}you can update billing after signup.
          </div>
        )}

        <Card className="border-slate-800 bg-slate-900 text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-white">
              Start for free
            </CardTitle>
            <CardDescription className="text-slate-400">
              Set up customer health scoring in 5 minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-800 bg-red-950 text-red-300 text-sm p-3">
                {error}
              </Alert>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <Chrome className="w-4 h-4" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">
                  Or sign up with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">
                    Full name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Jane Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org" className="text-slate-300">
                    Company name
                  </Label>
                  <Input
                    id="org"
                    type="text"
                    placeholder="Acme Corp"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Work email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
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
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
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
            <p className="text-sm text-slate-400 w-full text-center">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-600">
          <span>✓ No credit card required</span>
          <span>✓ Free forever plan</span>
          <span>✓ Cancel anytime</span>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
