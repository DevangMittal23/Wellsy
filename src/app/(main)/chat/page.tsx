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
  const fs = require("fs");
  const logDebug = (msg: string) => {
    try {
      fs.appendFileSync("d:\\Desktop\\projects\\messenger\\chat-debug.log", `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {}
  };

  const { user: username } = await searchParams;
  logDebug(`ChatPage rendering with searchParams.user = ${username || "undefined"}`);

  if (username) {
    logDebug(`ChatPage: fetching profile for ${username}`);
    const profile = await getProfile(username);
    if (profile) {
      logDebug(`ChatPage: found profile for ${username} (id: ${profile.id}). Calling getOrCreateDMRoom...`);
      const res = await getOrCreateDMRoom(profile.id);
      logDebug(`ChatPage: getOrCreateDMRoom result = ${JSON.stringify(res)}`);

      if (res && "roomId" in res && res.roomId) {
        logDebug(`ChatPage: Redirecting user to /chat/${res.roomId}`);
        redirect(`/chat/${res.roomId}`);
      } else {
        logDebug("ChatPage: getOrCreateDMRoom did not return a roomId");
      }
    } else {
      logDebug(`ChatPage: Profile not found for ${username}`);
    }
  }

  logDebug("ChatPage: Rendering ChatRoomList with user rooms...");
  const rooms = await getUserRooms();
  logDebug(`ChatPage: Found ${rooms.length} user rooms for listing.`);

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

