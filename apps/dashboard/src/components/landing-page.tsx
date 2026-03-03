"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/landing/hero-section";
import { TrustBar } from "@/components/landing/trust-bar";
import { ProblemCards } from "@/components/landing/problem-cards";
import { ProductDemo } from "@/components/landing/product-demo";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PricingSection } from "@/components/landing/pricing-section";
import { FinalCta } from "@/components/landing/final-cta";

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ─── Marketing Nav ─── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-sm font-semibold text-white">
            FinOps
          </Link>
          <nav className="hidden items-center gap-8 sm:flex">
            <a
              href="#features"
              className="text-sm text-[#666666] transition-colors hover:text-white"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-[#666666] transition-colors hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-sm text-[#666666] transition-colors hover:text-white"
            >
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-[#666666] transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link href="/onboarding">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      <HeroSection />

      <TrustBar />

      {/* Connector */}
      <div className="mx-auto h-16 w-px bg-gradient-to-b from-white/[0.08] to-transparent" />

      <ProblemCards />

      {/* Connector */}
      <div className="mx-auto h-16 w-px bg-gradient-to-b from-white/[0.08] to-transparent" />

      <ProductDemo />

      {/* Connector */}
      <div className="mx-auto h-16 w-px bg-gradient-to-b from-white/[0.08] to-transparent" />

      <HowItWorks />

      {/* Connector */}
      <div className="mx-auto h-16 w-px bg-gradient-to-b from-white/[0.08] to-transparent" />

      <PricingSection />

      <FinalCta />

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.04] py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">FinOps</span>
              <span className="text-xs text-[#555555]">
                Track your AI costs
              </span>
            </div>
            <nav className="flex items-center gap-6">
              <a
                href="#features"
                className="text-sm text-[#666666] transition-colors hover:text-white"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-[#666666] transition-colors hover:text-white"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="text-sm text-[#666666] transition-colors hover:text-white"
              >
                Pricing
              </a>
              <Link
                href="/dashboard"
                className="text-sm text-[#666666] transition-colors hover:text-white"
              >
                Dashboard
              </Link>
            </nav>
          </div>
          <div className="mt-8 border-t border-white/[0.04] pt-8 text-center">
            <p className="text-xs text-[#555555]">
              &copy; 2026 FinOps Tracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
