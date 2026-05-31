"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus } from "lucide-react";
import { FriendButton } from "@/components/friends/friend-button";
import { getInitials } from "@/lib/utils";

interface SuggestedPerson {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_online: boolean;
  followers_count: number;
}

interface PeopleGridProps {
  people: SuggestedPerson[];
}

export function PeopleGrid({ people }: PeopleGridProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visiblePeople = people.filter((p) => !dismissed.has(p.id));

  if (visiblePeople.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-subtle mb-4">
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
        {visiblePeople.map((person, index) => (
          <motion.div
            key={person.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
          >
            <div className="glass-card flex flex-col p-4 transition-colors hover:bg-surface-hover">
              {/* Top row — avatar + info */}
              <div className="flex items-start gap-3">
                <Link
                  href={`/profile/${person.username}`}
                  className="relative shrink-0"
                >
                  {person.avatar_url ? (
                    <img
                      src={person.avatar_url}
                      alt={person.display_name}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-border"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-muted text-base font-bold text-accent ring-2 ring-border">
                      {getInitials(person.display_name)}
                    </div>
                  )}
                  {person.is_online && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-success" />
                  )}
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
                  <p className="mt-1 text-[10px] text-text-muted">
                    {person.followers_count}{" "}
                    {person.followers_count === 1 ? "follower" : "followers"}
                  </p>
                </div>
              </div>

              {/* Action row */}
              <div className="mt-3 flex items-center gap-2">
                <FriendButton
                  targetUserId={person.id}
                  initialStatus="none"
                  size="sm"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
