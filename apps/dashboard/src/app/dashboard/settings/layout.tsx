"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, FolderKanban, KeyRound, CreditCard, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const SETTINGS_NAV = [
  { href: "/dashboard/settings", label: "General", icon: Settings },
  { href: "/dashboard/settings/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/settings/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/dashboard/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings/notifications", label: "Notifications", icon: Bell },
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
        <nav className="flex shrink-0 gap-1 overflow-x-auto md:w-48 md:flex-col">
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
                  "flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200",
                  isActive
                    ? "bg-white/[0.06] font-medium text-white"
                    : "text-[#888888] hover:bg-white/[0.03] hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
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
