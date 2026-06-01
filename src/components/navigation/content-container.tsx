"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ContentContainerProps {
  children: React.ReactNode;
}

export function ContentContainer({ children }: ContentContainerProps) {
  const pathname = usePathname();
  const isChat = pathname?.startsWith("/chat");

  return (
    <div
      className={cn(
        "mx-auto w-full px-4 pb-20 pt-4 transition-all duration-300 flex-1 flex flex-col",
        isChat ? "max-w-6xl lg:px-6 lg:pt-6 lg:pb-6" : "max-w-2xl lg:pb-8 lg:pt-6"
      )}
    >
      {children}
    </div>
  );
}
