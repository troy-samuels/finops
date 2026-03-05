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
          className="pointer-events-none absolute left-1/2 top-[-180px] h-[350px] w-[600px] -translate-x-1/2 rounded-full blur-[140px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(16, 163, 127, 0.04) 0%, rgba(66, 133, 244, 0.02) 50%, transparent 80%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-12 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
