"use client";

import { useState } from "react";
import { Avatar } from "@/components/shared/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Bell } from "lucide-react";
import Link from "next/link";

interface FriendRequestProps {
  requests: any[];
  onAccept: (requestId: string) => Promise<any>;
  onReject: (requestId: string) => Promise<any>;
}

export function FriendRequest({ requests, onAccept, onReject }: FriendRequestProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (requestId: string, action: "accept" | "reject") => {
    setProcessingId(requestId);
    try {
      if (action === "accept") {
        await onAccept(requestId);
      } else {
        await onReject(requestId);
      }
    } catch (err) {
      console.error(`Error during friend request action:`, err);
    } finally {
      setProcessingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center glass-card">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mb-4 ring-8 ring-accent/5">
          <Bell className="h-8 w-8 text-accent" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">No pending requests</h3>
        <p className="mt-2 text-sm text-text-secondary max-w-sm">
          Any incoming connection requests will show up here. You'll receive a notification when someone adds you!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {requests.map((request, idx) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            layout
            className="glass-card flex items-center justify-between p-4 transition-all duration-200 hover:border-accent/10"
          >
            <Link
              href={`/profile/${request.sender?.username}`}
              className="flex items-center gap-3 min-w-0 group"
            >
              <Avatar
                src={request.sender?.avatar_url}
                name={request.sender?.display_name || "User"}
                isOnline={request.sender?.is_online}
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-text-primary truncate group-hover:text-accent transition-colors">
                  {request.sender?.display_name || "User"}
                </p>
                <p className="text-xs text-text-muted truncate">
                  @{request.sender?.username}
                </p>
                {request.sender?.bio && (
                  <p className="text-[11px] text-text-muted truncate mt-0.5 max-w-[200px] sm:max-w-xs">
                    {request.sender.bio}
                  </p>
                )}
              </div>
            </Link>

            {/* Accept / Reject actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                disabled={processingId === request.id}
                onClick={() => handleAction(request.id, "accept")}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 text-success transition-all duration-200 hover:bg-success hover:text-white active:scale-95 disabled:opacity-50"
                title="Accept Request"
              >
                <Check className="h-4 w-4" />
              </button>
              
              <button
                disabled={processingId === request.id}
                onClick={() => handleAction(request.id, "reject")}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-error-muted text-error transition-all duration-200 hover:bg-error hover:text-white active:scale-95 disabled:opacity-50"
                title="Decline Request"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
