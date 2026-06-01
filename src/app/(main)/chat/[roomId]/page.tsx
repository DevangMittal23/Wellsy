import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRoomInfo, getRoomMessages, getUserRooms } from "@/actions/chat-actions";
import { ChatMessageArea } from "@/components/chat/chat-message-area";
import { ChatLayout } from "@/components/chat/chat-layout";
import type { Message } from "@/types/chat";

interface ChatRoomPageProps {
  params: Promise<{ roomId: string }>;
}

export async function generateMetadata({
  params,
}: ChatRoomPageProps): Promise<Metadata> {
  const { roomId } = await params;
  const roomInfo = await getRoomInfo(roomId);

  if (!roomInfo) {
    return { title: "Chat not found" };
  }

  const otherUserName = roomInfo.other_user?.display_name || "Chat";

  return {
    title: `Chat with ${otherUserName}`,
    description: `Private conversation with ${otherUserName} on WELLSY.`,
  };
}

export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { roomId } = await params;
  const roomInfo = await getRoomInfo(roomId);

  if (!roomInfo) {
    notFound();
  }

  const [{ messages }, rooms] = await Promise.all([
    getRoomMessages(roomId),
    getUserRooms(),
  ]);

  return (
    <ChatLayout rooms={rooms} activeRoomId={roomId}>
      <ChatMessageArea
        roomId={roomId}
        initialMessages={messages as Message[]}
        roomInfo={roomInfo}
      />
    </ChatLayout>
  );
}
