import { Sidebar } from "@/components/navigation/sidebar";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { ContentContainer } from "@/components/navigation/content-container";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 lg:ml-[260px] flex flex-col min-h-dvh">
        <ContentContainer>{children}</ContentContainer>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
