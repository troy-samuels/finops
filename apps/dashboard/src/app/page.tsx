import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";

export const metadata: Metadata = {
  title: "FinOps Tracker — Know Your True AI Costs",
  description:
    "Track per-token API costs, recurring subscriptions, and infrastructure spend across OpenAI, Anthropic, and more. One SDK. One dashboard. Zero guesswork.",
};

export default function Page() {
  return <LandingPage />;
}
