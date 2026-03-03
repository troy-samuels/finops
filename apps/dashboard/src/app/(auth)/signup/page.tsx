"use client";

import { useState } from "react";
import Link from "next/link";
import { Github } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleOAuth(provider: string) {
    toast.info(`${provider} sign-up coming soon`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Account created", {
      description: "Redirecting to onboarding...",
    });
  }

  return (
    <div className="rounded-xl bg-white/[0.02] p-8 ring-1 ring-white/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      <p className="text-center text-sm font-semibold text-white">FinOps</p>

      <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight text-white">
        Create your account
      </h1>
      <p className="mt-2 text-center text-sm text-[#666666]">
        Start tracking your AI costs in minutes
      </p>

      <Button
        className="mt-8 w-full gap-2"
        onClick={() => handleOAuth("GitHub")}
      >
        <Github className="h-4 w-4" />
        Continue with GitHub
      </Button>
      <Button
        variant="outline"
        className="mt-3 w-full gap-2"
        onClick={() => handleOAuth("Google")}
      >
        Continue with Google
      </Button>

      <div className="relative my-6">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0A0A0A] px-3 text-xs text-[#555555]">
          or
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button className="w-full" type="submit">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#666666]">
        Already have an account?{" "}
        <Link href="/login" className="text-white hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
