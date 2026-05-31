"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "@/stores/chat-store";
import { ChatRoomItem } from "./chat-room-item";
import { MessageCircle } from "lucide-react";

interface ChatRoomListProps {
  initialRooms: Array<{
    id: string;
    name: string | null;
    is_group: boolean;
    last_message_at: string;
    other_user?: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      is_online: boolean;
    } | null;
    last_message?: {
      id: string;
      content: string | null;
      message_type: string;
      created_at: string;
      sender_id: string;
    } | null;
    unread_count?: number;
  }>;
}

export function ChatRoomList({ initialRooms }: ChatRoomListProps) {
  const { rooms, setRooms } = useChatStore();

  useEffect(() => {
    setRooms(initialRooms);
  }, [initialRooms, setRooms]);

  const displayRooms = rooms.length > 0 ? rooms : initialRooms;

  if (displayRooms.length === 0) {
    return (
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
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {displayRooms.map((room, index) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
          >
            <ChatRoomItem room={room} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
