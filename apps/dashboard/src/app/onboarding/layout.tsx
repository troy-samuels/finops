export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#0A0A0A]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-150px] h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-white/[0.03] blur-[120px]"
      />
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
        {children}
      </div>
    </div>
  );
}
