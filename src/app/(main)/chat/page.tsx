import type { Metadata } from "next";
import { getUserRooms, getOrCreateDMRoom } from "@/actions/chat-actions";
import { getProfile } from "@/actions/profile-actions";
import { ChatLayout } from "@/components/chat/chat-layout";
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

  logDebug("ChatPage: Fetching user rooms...");
  const rooms = await getUserRooms();
  logDebug(`ChatPage: Found ${rooms.length} user rooms for listing.`);

  return (
    <ChatLayout rooms={rooms}>
      <div className="flex flex-1 flex-col items-center justify-center text-center p-6 bg-surface/5">
        <div className="max-w-xs space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-2xl text-accent shadow-sm shadow-accent/5 ring-8 ring-accent/5">
            💬
          </div>
          <h3 className="text-base font-semibold text-text-primary">Your Messages</h3>
          <p className="text-xs text-text-muted">
            Select a conversation from the sidebar list to start chatting, or find friends to start a new chat.
          </p>
        </div>
      </div>
    </ChatLayout>
  );
}

