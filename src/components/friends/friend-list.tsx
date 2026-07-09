"use client";

import { useState } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, UserMinus, Search, Users } from "lucide-react";
import { createDM as getOrCreateDM } from "@/actions/conversations";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@/types";
import { toast } from "sonner";

interface FriendListProps {
  friends: User[];
  onRemoveFriend: (friendId: string) => Promise<any>;
}

export function FriendList({ friends, onRemoveFriend }: FriendListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const router = useRouter();

  const filteredFriends = friends.filter(
    (friend) =>
      friend.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChat = async (friendId: string) => {
    setActioningId(friendId);
    try {
      const res = await getOrCreateDM(friendId);
      if (res && res.conversation) {
        toast.success("Opening chat room...");
        router.push(`/chat/${res.conversation.id}`);
      } else if (res && res.error) {
        toast.error(res.error);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to open chat room");
      console.error("Error opening DM room:", err);
    } finally {
      setActioningId(null);
    }
  };

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center glass-card">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mb-4 ring-8 ring-accent/5">
          <Users className="h-8 w-8 text-accent" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">No friends yet</h3>
        <p className="mt-2 text-sm text-text-secondary max-w-sm">
          Discover interesting people on HUDdang and send them friend requests to stay connected!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface-secondary py-3 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      {/* Friends Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filteredFriends.map((friend, idx) => (
            <motion.div
              key={friend.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              layout
              className="glass-card flex items-center justify-between p-4 transition-all duration-200 hover:border-accent/10 hover:shadow-lg"
            >
              <Link
                href={`/profile/${friend.username}`}
                className="flex items-center gap-3 min-w-0 group"
              >
                <UserAvatar
                  src={friend.avatar_url}
                  name={friend.display_name}
                  isOnline={true}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-text-primary truncate group-hover:text-accent transition-colors">
                    {friend.display_name}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    @{friend.username}
                  </p>
                </div>
              </Link>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleStartChat(friend.id)}
                  disabled={actioningId === friend.id}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent transition-all duration-200 hover:bg-accent hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Send Message"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => onRemoveFriend(friend.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-error/10 text-error transition-all duration-200 hover:bg-error hover:text-white active:scale-95 cursor-pointer"
                  title="Remove Friend"
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredFriends.length === 0 && searchQuery && (
          <div className="col-span-full py-8 text-center text-sm text-text-muted">
            No friends match your search.
          </div>
        )}
      </div>
    </div>
  );
}
