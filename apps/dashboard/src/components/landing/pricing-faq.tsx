"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How does the free tier work?",
    answer:
      "The free tier gives you 25,000 API calls tracked per month, perfect for small projects or testing. You can track one project with 7 days of data retention. No credit card required. Upgrade anytime when you need more capacity.",
  },
  {
    question: "Can I switch plans anytime?",
    answer:
      "Yes, you can upgrade or downgrade at any time. When upgrading, you'll be charged the prorated amount for the remainder of your billing cycle. When downgrading, the change takes effect at the end of your current billing period.",
  },
  {
    question: "Do you offer startup discounts?",
    answer:
      "Yes! We offer up to 50% off for early-stage startups (pre-Series A). If you're backed by Y Combinator, Techstars, or similar accelerators, we offer additional credits. Contact us at hello@finops.dev with your company details.",
  },
  {
    question: "What happens if I exceed my API call limit?",
    answer:
      "We'll notify you by email when you reach 80% and 100% of your limit. Once exceeded, tracking continues but you'll need to upgrade to access the additional data. We never stop tracking or delete your data—you just need to upgrade to unlock it.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We're SOC 2 Type II compliant (Enterprise), encrypt all data in transit and at rest, and never share your data with third parties. We only track metadata about your API calls—never the actual request or response content. Your API keys never leave your infrastructure.",
  },
  {
    question: "Do you support self-hosted deployment?",
    answer:
      "Yes, self-hosted deployment is available on the Enterprise plan. You can deploy FinOps Tracker in your own cloud (AWS, GCP, Azure) or on-premises infrastructure. This gives you complete control over data residency and security. Contact sales for implementation details.",
  },
];

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { ref: faqRef, inView: faqVisible } = useInView<HTMLDivElement>();

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div ref={faqRef} className="mt-24">
      <h3
        className={cn(
          "text-center text-2xl font-semibold text-white transition-all duration-700",
          faqVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
      >
        Frequently asked questions
      </h3>
      <div className="mx-auto mt-12 max-w-3xl space-y-4">
        {FAQ_ITEMS.map((item, index) => (
          <div
            key={index}
            className={cn(
              "overflow-hidden rounded-xl bg-white/[0.02] ring-1 ring-white/[0.05] transition-all duration-500",
              faqVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
            style={{ transitionDelay: `${index * 0.1}s` }}
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-white/[0.02]"
            >
              <span className="text-base font-medium text-white">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-[#666666] transition-transform",
                  openIndex === index && "rotate-180",
                )}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                openIndex === index ? "max-h-96" : "max-h-0",
              )}
            >
              <div className="px-6 pb-6 text-sm leading-relaxed text-[#AAAAAA]">
                {item.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
