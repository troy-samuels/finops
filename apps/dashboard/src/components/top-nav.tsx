"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/subscriptions", label: "Integrations" },
  { href: "/dashboard/settings", label: "Settings" },
] as const;

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/dashboard" className="text-sm font-semibold text-white">
          FinOps
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm transition-colors",
                  isActive
                    ? "font-medium text-white"
                    : "text-[#666666] hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-xs font-medium text-[#888888]">
          {getInitials("Troy Samuels")}
        </div>
      </div>
    </header>
  );
}
