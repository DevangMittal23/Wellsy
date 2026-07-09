"use client";

import { useState, useEffect, useCallback } from "react";
import { getFriendshipStatus } from "@/actions/friendships";
import type { FriendshipStatus } from "@/types";

export function useFriendStatus(otherUserId: string) {
  const [status, setStatus] = useState<FriendshipStatus | null>(null);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [isRequester, setIsRequester] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const result = await getFriendshipStatus(otherUserId);
    setStatus(result.status);
    setFriendshipId(result.friendshipId);
    setIsRequester(result.isRequester);
    setIsLoading(false);
  }, [otherUserId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, friendshipId, isRequester, isLoading, refresh };
}
