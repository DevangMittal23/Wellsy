import { Sidebar } from "@/components/navigation/sidebar";
import { BottomNav } from "@/components/navigation/bottom-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 lg:ml-[260px]">
        <div className="mx-auto max-w-2xl px-4 pb-20 pt-4 lg:pb-8 lg:pt-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
