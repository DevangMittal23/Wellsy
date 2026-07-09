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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <AnimatePresence mode="popLayout">
        {people.map((person, index) => {
          const isSent = sentIds.has(person.id);
          const isLoading = loadingIds.has(person.id);

          return (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.04, duration: 0.25 }}
            >
              <div className="glass-card flex flex-col p-4 transition-colors hover:bg-surface-hover">
                <div className="flex items-start gap-3">
                  <Link
                    href={`/profile/${person.username}`}
                    className="relative shrink-0"
                  >
                    <UserAvatar
                      src={person.avatar_url}
                      name={person.display_name}
                      isOnline={true}
                      size="sm"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link href={`/profile/${person.username}`} className="group">
                      <p className="truncate text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
                        {person.display_name}
                      </p>
                      <p className="text-xs text-text-muted">
                        @{person.username}
                      </p>
                    </Link>
                    {person.bio && (
                      <p className="mt-1 line-clamp-2 text-xs text-text-secondary leading-relaxed">
                        {person.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Add Friend Action Button */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    disabled={isSent || isLoading}
                    onClick={() => handleSendRequest(person.id)}
                    className={`flex h-9 items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 disabled:opacity-80 cursor-pointer ${
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
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
