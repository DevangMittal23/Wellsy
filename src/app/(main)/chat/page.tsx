import type { Metadata } from "next";
import { getUserRooms, getOrCreateDMRoom } from "@/actions/chat-actions";
import { getProfile } from "@/actions/profile-actions";
import { ChatRoomList } from "@/components/chat/chat-room-list";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Chat",
  description: "Your conversations on WELLSY.",
};

interface ChatPageProps {
  searchParams: Promise<{ user?: string }>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const { user: username } = await searchParams;

  if (username) {
    const profile = await getProfile(username);
    if (profile) {
      const res = await getOrCreateDMRoom(profile.id);
      if (res && "roomId" in res && res.roomId) {
        redirect(`/chat/${res.roomId}`);
      }
    }
  }

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

