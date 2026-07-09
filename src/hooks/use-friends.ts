"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getFriends,
  getPendingRequests,
  getSuggestedUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend as removeFriendAction,
} from "@/actions/friendships";
import type { User, Friendship } from "@/types";
import { toast } from "sonner";

export function useFriends(userId?: string) {
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const [fData, rData, sData] = await Promise.all([
        getFriends(),
        getPendingRequests(),
        getSuggestedUsers(),
      ]);
      setFriends(fData);
      setPendingRequests(rData as any[]);
      setSuggestions(sData);
    } catch (err) {
      console.error("Failed to load friendships:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      refresh();
    }
  }, [userId, refresh]);

  const sendRequest = async (targetUserId: string) => {
    try {
      const res = await sendFriendRequest(targetUserId);
      if (res.error) {
        toast.error(res.error);
        return res;
      }
      toast.success("Friend request sent!");
      refresh();
      return res;
    } catch (err) {
      toast.error("Failed to send request");
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    try {
      const res = await acceptFriendRequest(friendshipId);
      if (res.error) {
        toast.error(res.error);
        return res;
      }
      toast.success("Request accepted!");
      refresh();
      return res;
    } catch (err) {
      toast.error("Failed to accept request");
    }
  };

  const rejectRequest = async (friendshipId: string) => {
    try {
      const res = await rejectFriendRequest(friendshipId);
      if (res.error) {
        toast.error(res.error);
        return res;
      }
      toast.success("Request declined");
      refresh();
      return res;
    } catch (err) {
      toast.error("Failed to decline request");
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const res = await removeFriendAction(friendshipId);
      if (res.error) {
        toast.error(res.error);
        return res;
      }
      toast.success("Friend removed");
      refresh();
      return res;
    } catch (err) {
      toast.error("Failed to remove friend");
    }
  };

  return {
    friends,
    pendingRequests,
    suggestions,
    isLoading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    refresh,
  };
}
