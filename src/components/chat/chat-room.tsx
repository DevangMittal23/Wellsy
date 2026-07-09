"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Video, Info } from "lucide-react";
import { useMessages } from "@/hooks/use-messages";
import { usePresence } from "@/hooks/use-presence";
import { useTyping } from "@/hooks/use-typing";
import { useCall } from "@/hooks/use-call";
import { useAuth } from "@/hooks/use-auth";
import { useUIStore } from "@/stores/ui-store";
import { markConversationRead } from "@/actions/messages";
import { UserAvatar } from "@/components/shared/user-avatar";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import type { Conversation, User } from "@/types";

interface ChatRoomProps {
  conversationId: string;
  initialConversation: Conversation;
}

export function ChatRoom({
  conversationId,
  initialConversation,
}: ChatRoomProps) {
  const { user: currentUser } = useAuth();
  const { isOnline } = usePresence();
  const { typingUsers, broadcastTyping } = useTyping(conversationId);
  const { startCall } = useCall();
  const { openModal } = useUIStore();

  const { messages, isLoading, hasMore, loadMore, sendMessage } =
    useMessages(conversationId);

  // Mark read on load and when messages change
  useEffect(() => {
    markConversationRead(conversationId).catch(console.error);
  }, [conversationId, messages.length]);

  const otherParticipant =
    initialConversation.type === "dm"
      ? initialConversation.participants?.find(
          (p) => p.user_id !== currentUser?.id
        )
      : null;
  const otherUser = otherParticipant?.user;

  const displayName =
    initialConversation.type === "group"
      ? initialConversation.name || "Group Chat"
      : otherUser?.display_name || "HUDdang User";

  const isUserOnline =
    initialConversation.type === "dm" && otherUser
      ? isOnline(otherUser.id)
      : false;

  const handleVoiceCall = () => {
    if (otherUser) {
      startCall(conversationId, "voice", [otherUser]);
    }
  };

  const handleVideoCall = () => {
    if (otherUser) {
      startCall(conversationId, "video", [otherUser]);
    }
  };

  const handleGroupInfo = () => {
    openModal("group-info", { conversationId, conversation: initialConversation });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background-secondary/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-background-secondary/80 backdrop-blur-lg px-4 py-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/chat"
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-secondary lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar
              src={
                initialConversation.type === "group"
                  ? initialConversation.avatar_url
                  : otherUser?.avatar_url
              }
              name={displayName}
              size="sm"
              isOnline={isUserOnline}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">
                {displayName}
              </p>
              <p className="text-xs text-text-muted truncate">
                {initialConversation.type === "group"
                  ? `${initialConversation.participants?.length || 0} participants`
                  : isUserOnline
                  ? "Online"
                  : otherUser?.username
                  ? `@${otherUser.username}`
                  : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {initialConversation.type === "dm" && (
            <>
              <button
                onClick={handleVoiceCall}
                className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-text-secondary cursor-pointer"
                title="Voice Call"
              >
                <Phone className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={handleVideoCall}
                className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-text-secondary cursor-pointer"
                title="Video Call"
              >
                <Video className="h-4.5 w-4.5" />
              </button>
            </>
          )}
          {initialConversation.type === "group" && (
            <button
              onClick={handleGroupInfo}
              className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-text-secondary cursor-pointer"
              title="Group Info"
            >
              <Info className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 min-h-0 relative">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          hasMore={hasMore}
          loadMore={loadMore}
          typingUsers={typingUsers}
          currentUserId={currentUser?.id}
        />
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={sendMessage}
        onTyping={broadcastTyping}
        conversationId={conversationId}
      />
    </div>
  );
}
