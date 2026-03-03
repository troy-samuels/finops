import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { TopDriver } from "@/lib/types";

interface TopDriversProps {
  drivers: TopDriver[];
}

export function TopDrivers({ drivers }: TopDriversProps) {
  return (
    <div>
      <h2 className="text-sm font-medium uppercase tracking-wide text-[#888888]">
        Where your money goes
      </h2>
      <div className="mt-4">
        {drivers.map((driver, i) => (
          <div
            key={driver.name}
            className={`flex items-center justify-between py-3 ${
              i < drivers.length - 1 ? "border-b border-white/[0.04]" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-5 text-sm tabular-nums text-[#555555]">
                {driver.rank}.
              </span>
              <span className="text-sm text-white">{driver.name}</span>
            </div>
            <span className="text-sm font-medium tabular-nums text-white">
              {formatCurrency(driver.cost)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-right">
        <Link
          href="/dashboard/subscriptions"
          className="text-sm text-[#666666] transition-colors hover:text-white"
        >
          View full report &rarr;
        </Link>
      </div>
    </div>
  );
}
