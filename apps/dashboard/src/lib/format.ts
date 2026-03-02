/**
 * Format a number as USD currency.
 * formatCurrency(1234.5) => "$1,234.50"
 * formatCurrency(0.003) => "$0.0030" (preserves precision for small amounts)
 */
export function formatCurrency(amount: number): string {
  if (Math.abs(amount) < 0.01 && amount !== 0) {
    return `$${amount.toFixed(4)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a large number with commas.
 * formatNumber(1234567) => "1,234,567"
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/**
 * Format a compact number.
 * formatCompact(1234) => "1.2K"
 */
export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/**
 * Format an ISO date string to a readable date.
 * formatDate("2026-02-15T10:00:00Z") => "Feb 15, 2026"
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format date for chart axis (short month + day).
 * formatChartDate("2026-02-15") => "Feb 15"
 */
export function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format a relative time string.
 * formatRelativeTime("2026-02-28T10:00:00Z") => "2d ago"
 */
export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${String(diffDays)}d ago`;
  if (diffDays < 365) return `${String(Math.floor(diffDays / 30))}mo ago`;
  return `${String(Math.floor(diffDays / 365))}y ago`;
}
