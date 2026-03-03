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
        {/* Atmospheric glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-150px] h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-white/[0.03] blur-[120px]"
        />
        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-12">
          {children}
        </div>
      </main>
    </div>
  );
}
