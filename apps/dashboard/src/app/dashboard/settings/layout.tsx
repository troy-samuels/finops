"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SETTINGS_NAV = [
  { href: "/dashboard/settings", label: "General" },
  { href: "/dashboard/settings/projects", label: "Projects" },
  { href: "/dashboard/settings/api-keys", label: "API Keys" },
  { href: "/dashboard/settings/billing", label: "Billing" },
  { href: "/dashboard/settings/notifications", label: "Notifications" },
] as const;

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Settings
      </h1>
      <p className="mt-2 text-sm text-[#666666]">
        Manage your account, integrations, and notification preferences.
      </p>

      <div className="mt-8 flex flex-col gap-8 md:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto md:w-44 md:flex-col">
          {SETTINGS_NAV.map((item) => {
            const isActive =
              item.href === "/dashboard/settings"
                ? pathname === "/dashboard/settings"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-white/[0.06] font-medium text-white"
                    : "text-[#888888] hover:bg-white/[0.03] hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
