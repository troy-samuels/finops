export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[20%] h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-white/[0.03] blur-[120px]"
      />
      <div className="relative w-full max-w-sm">{children}</div>
    </div>
  );
}
