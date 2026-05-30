import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to WELLSY",
  description: "Sign in or create an account to join the conversation.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-8">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        {/* Primary gradient orb */}
        <div
          className="absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, hsl(263 70% 58%), hsl(290 65% 55%), transparent 70%)",
          }}
        />
        {/* Secondary accent orb */}
        <div
          className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-10 blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, hsl(320 70% 55%), transparent 70%)",
          }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="gradient-text text-4xl font-bold tracking-tight">
            WELLSY
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Where conversations feel alive
          </p>
        </div>

        {/* Auth card */}
        <div className="glass-card p-8">{children}</div>
      </div>
    </div>
  );
}
