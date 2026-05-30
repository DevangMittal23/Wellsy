import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Chat",
  description: "Your conversations on WELLSY.",
};

export default function ChatPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Messages</h1>
        <p className="text-sm text-text-secondary">
          Your conversations
        </p>
      </div>

      <div className="glass-card flex flex-col items-center justify-center py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-subtle mb-4">
          <MessageCircle className="h-8 w-8 text-accent" />
        </div>
        <p className="text-lg font-medium text-text-secondary">
          No conversations yet
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Start a chat by visiting someone&apos;s profile
        </p>
        <p className="mt-4 text-xs text-text-muted">
          Real-time chat coming in Phase 2
        </p>
      </div>
    </div>
  );
}
