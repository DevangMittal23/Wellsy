"use client";

import { useEffect, useState, useTransition } from "react";
import { X, UserPlus, ShieldAlert, LogOut, Trash2 } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useAuth } from "@/hooks/use-auth";
import { addGroupMember, removeGroupMember } from "@/actions/conversations";
import { getFriends } from "@/actions/friendships";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Conversation, User } from "@/types";
import { useRouter } from "next/navigation";

export function GroupInfo() {
  const { modalData, closeModal } = useUIStore();
  const { user } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const conversation = modalData.conversation as Conversation;
  const conversationId = modalData.conversationId as string;

  const [participants, setParticipants] = useState(conversation?.participants || []);
  const [friends, setFriends] = useState<User[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const currentUserParticipant = participants.find((p) => p.user_id === user?.id);
  const isAdmin = currentUserParticipant?.role === "admin";

  useEffect(() => {
    if (showAddMember) {
      setLoadingFriends(true);
      getFriends()
        .then((list) => {
          // Filter out users who are already in the group
          const existingIds = new Set(participants.map((p) => p.user_id));
          setFriends(list.filter((f) => !existingIds.has(f.id)));
        })
        .finally(() => setLoadingFriends(false));
    }
  }, [showAddMember, participants]);

  const handleAddUser = (targetUser: User) => {
    startTransition(async () => {
      try {
        const res = await addGroupMember(conversationId, targetUser.id);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(`${targetUser.display_name} added!`);
          // Optimistic state update
          setParticipants((prev) => [
            ...prev,
            {
              id: `temp-${Date.now()}`,
              conversation_id: conversationId,
              user_id: targetUser.id,
              role: "member",
              last_read_message_id: null,
              joined_at: new Date().toISOString(),
              user: targetUser,
            },
          ]);
          setShowAddMember(false);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to add member");
      }
    });
  };

  const handleRemoveUser = (targetUserId: string, name: string) => {
    startTransition(async () => {
      try {
        const res = await removeGroupMember(conversationId, targetUserId);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(`${name} removed`);
          setParticipants((prev) => prev.filter((p) => p.user_id !== targetUserId));
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to remove member");
      }
    });
  };

  const handleLeaveGroup = () => {
    if (!user) return;
    startTransition(async () => {
      try {
        const res = await removeGroupMember(conversationId, user.id);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Left group chat");
          closeModal();
          router.push("/chat");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to leave group");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary">Group Details</h3>
        <button
          onClick={closeModal}
          className="rounded-full hover:bg-surface-hover p-1 text-text-secondary cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="flex flex-col items-center py-4 border-b border-border/20">
        <UserAvatar src={conversation?.avatar_url} name={conversation?.name || "Group"} size="xl" />
        <h4 className="text-base font-bold text-text-primary mt-2">
          {conversation?.name || "Group Chat"}
        </h4>
        <span className="text-xs text-text-muted">
          {participants.length} Members
        </span>
      </div>

      {/* Members Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Members
          </span>
          {isAdmin && (
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="flex items-center gap-1 text-xs font-bold text-accent hover:text-accent-hover cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Member
            </button>
          )}
        </div>

        {showAddMember && (
          <div className="bg-surface/50 border border-border rounded-xl p-2.5 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-text-secondary border-b border-border/10 pb-1 mb-1">
              <span>Select Friend to Add</span>
              <button onClick={() => setShowAddMember(false)} className="text-text-muted">
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1.5 scrollbar-thin">
              {loadingFriends ? (
                <div className="flex justify-center py-2">
                  <span className="text-[10px] text-text-muted">Loading friends...</span>
                </div>
              ) : friends.length > 0 ? (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => handleAddUser(friend)}
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar src={friend.avatar_url} name={friend.display_name} size="xs" />
                      <span className="text-xs font-medium text-text-primary">
                        {friend.display_name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-accent uppercase">Add</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-2 text-[10px] text-text-muted">
                  No friends available to add.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-2">
          {participants.map((p) => {
            const member = p.user;
            if (!member) return null;
            const isMemberAdmin = p.role === "admin";
            const isSelf = member.id === user?.id;

            return (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar src={member.avatar_url} name={member.display_name} size="sm" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-text-primary">
                        {member.display_name}
                      </p>
                      {isMemberAdmin && (
                        <span className="bg-accent/15 text-accent text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-text-muted">@{member.username}</p>
                  </div>
                </div>

                {!isSelf && isAdmin && (
                  <button
                    onClick={() => handleRemoveUser(member.id, member.display_name)}
                    className="p-1.5 rounded hover:bg-error/10 text-text-muted hover:text-error transition-colors cursor-pointer"
                    title="Remove member"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leave group button */}
      <div className="pt-4 border-t border-border/20">
        <Button
          variant="destructive"
          className="w-full flex items-center justify-center gap-2 cursor-pointer font-semibold"
          onClick={handleLeaveGroup}
          disabled={isPending}
        >
          <LogOut className="h-4 w-4" />
          Leave Group Chat
        </Button>
      </div>
    </div>
  );
}
