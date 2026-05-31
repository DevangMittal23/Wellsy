import type { Metadata } from "next";
import { getUserRooms } from "@/actions/chat-actions";
import { ChatRoomList } from "@/components/chat/chat-room-list";

export const metadata: Metadata = {
  title: "Chat",
  description: "Your conversations on WELLSY.",
};

export default async function ChatPage() {
  const rooms = await getUserRooms();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Messages</h1>
        <p className="text-sm text-text-secondary">Your conversations</p>
      </div>

      <ChatRoomList initialRooms={rooms} />
    </div>
  );
}
