"use client";

import { cn } from "@/lib/utils";
import { ChatRoomList } from "./chat-room-list";

interface ChatLayoutProps {
  rooms: any[];
  activeRoomId?: string;
  children: React.ReactNode;
}

export function ChatLayout({ rooms, activeRoomId, children }: ChatLayoutProps) {
  const isInsideRoom = !!activeRoomId;

  return (
    <div className="flex h-[calc(100dvh-80px)] lg:h-[calc(100dvh-48px)] gap-0 -mx-4 lg:mx-0 -mt-4 lg:mt-0 border-y lg:border border-border/20 lg:rounded-3xl overflow-hidden bg-background-secondary/40 backdrop-blur-md shadow-2xl">
      {/* Left side: Room list (sidebar) */}
      <div
        className={cn(
          "w-full lg:w-[320px] shrink-0 border-r border-border/20 flex flex-col bg-surface/10 p-4.5 overflow-hidden",
          isInsideRoom && "hidden lg:flex"
        )}
      >
        <div className="mb-4 shrink-0">
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Messages</h1>
          <p className="text-xs text-text-muted">Your active conversations</p>
        </div>
        <div className="flex-1 min-h-0">
          <ChatRoomList initialRooms={rooms} />
        </div>
      </div>

      {/* Right side: Active conversation / Placeholder content */}
      <div
        className={cn(
          "flex-1 flex flex-col bg-surface/5 overflow-hidden relative",
          !isInsideRoom && "hidden lg:flex"
        )}
      >
        {children}
      </div>
    </div>
  );
}
