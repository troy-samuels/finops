import { TopNav } from "@/components/top-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <TopNav />
      <main className="relative">
        {/* Dual-color atmospheric glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-150px] h-[250px] w-[400px] -translate-x-1/2 rounded-full blur-[120px] md:h-[300px] md:w-[600px]"
          style={{
            background:
              "radial-gradient(ellipse, hsl(var(--chart-1) / 0.04) 0%, hsl(var(--chart-2) / 0.03) 50%, transparent 80%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-12 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
