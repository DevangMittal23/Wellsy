"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Check, Loader2 } from "lucide-react";
import { sendFriendRequest } from "@/actions/friendships";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { User } from "@/types";
import { toast } from "sonner";

interface PeopleGridProps {
  people: User[];
}

export function PeopleGrid({ people }: PeopleGridProps) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const handleSendRequest = (userId: string) => {
    setLoadingIds((prev) => new Set([...prev, userId]));
    startTransition(async () => {
      try {
        const res = await sendFriendRequest(userId);
        if (res.error) {
          toast.error(res.error);
        } else {
          setSentIds((prev) => new Set([...prev, userId]));
          toast.success("Friend request sent!");
        }
      } catch {
        toast.error("Failed to send request");
      } finally {
        setLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    });
  };

  if (people.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-muted/20 mb-4">
          <UserPlus className="h-8 w-8 text-accent" />
        </div>
        <p className="text-lg font-medium text-text-secondary">
          No suggestions right now
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Check back later for new people to connect with
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {people.map((person, index) => {
          const isSent = sentIds.has(person.id);
          const isLoading = loadingIds.has(person.id);
          const mutualCount = (person as any).mutual_friends_count || 0;

          return (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <Link href={`/profile/${person.username}`} className="shrink-0">
                  <UserAvatar
                    src={person.avatar_url}
                    name={person.display_name}
                    isOnline={true}
                    size="md"
                  />
                </Link>
                <div>
                  <Link href={`/profile/${person.username}`} className="group">
                    <p className="font-semibold text-sm text-text-primary group-hover:text-accent transition-colors">
                      {person.display_name}
                    </p>
                    <p className="text-xs text-text-muted">@{person.username}</p>
                  </Link>
                  {person.bio && (
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                      {person.bio}
                    </p>
                  )}
                  <p className="text-xs text-purple-400 mt-0.5">
                    {mutualCount > 0 
                      ? `${mutualCount} mutual friend${mutualCount > 1 ? 's' : ''}`
                      : 'New to HUDdang'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={isSent || isLoading}
                  onClick={() => handleSendRequest(person.id)}
                  className={`flex h-9 items-center justify-center gap-1.5 px-4 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 disabled:opacity-80 cursor-pointer ${
                    isSent
                      ? "bg-success/10 text-success cursor-default"
                      : "bg-accent text-white hover:bg-accent-hover"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isSent ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Sent
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      Add Friend
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
