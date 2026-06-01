"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getFriends,
  getPendingFriendRequests,
  getSuggestedPeople,
  sendFriendRequest as apiSendFriendRequest,
  acceptFriendRequest as apiAcceptFriendRequest,
  rejectFriendRequest as apiRejectFriendRequest,
  removeFriend as apiRemoveFriend,
} from "@/actions/friend-actions";
import type { Profile } from "@/types/user";

export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<Profile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all initial data
  const fetchData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [friendsList, pendingList, suggestionsList] = await Promise.all([
        getFriends(),
        getPendingFriendRequests(),
        getSuggestedPeople(),
      ]);
      setFriends(friendsList as Profile[]);
      setPendingRequests(pendingList);
      setSuggestions(suggestionsList as Profile[]);
    } catch (err) {
      console.error("Error fetching social data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    // 1. Subscription to friend_requests
    const requestChannel = supabase
      .channel(`realtime-requests-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
        },
        async (payload) => {
          const { eventType, new: newReq, old: oldReq } = payload;

          if (eventType === "INSERT" && newReq.receiver_id === userId) {
            // Fetch request sender profile
            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("id, username, display_name, avatar_url, bio, is_online")
              .eq("id", newReq.sender_id)
              .single();

            if (senderProfile) {
              setPendingRequests((prev) => [
                { ...newReq, sender: senderProfile },
                ...prev.filter((r) => r.id !== newReq.id),
              ]);
            }
          } else if (eventType === "UPDATE") {
            if (newReq.status !== "pending") {
              setPendingRequests((prev) => prev.filter((r) => r.id !== newReq.id));
              // If accepted, refresh friends
              if (newReq.status === "accepted") {
                const friendsList = await getFriends();
                setFriends(friendsList as Profile[]);
              }
            }
          } else if (eventType === "DELETE") {
            setPendingRequests((prev) => prev.filter((r) => r.id !== oldReq.id));
          }
        }
      )
      .subscribe();

    // 2. Subscription to friends table changes
    const friendsChannel = supabase
      .channel(`realtime-friends-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friends",
        },
        async (payload) => {
          const { eventType, new: newFriendship, old: oldFriendship } = payload;

          if (eventType === "INSERT" && newFriendship.user_id === userId) {
            const friendsList = await getFriends();
            setFriends(friendsList as Profile[]);
          } else if (eventType === "DELETE") {
            // Since delete removes bidirectional friendship, we just reload
            const friendsList = await getFriends();
            setFriends(friendsList as Profile[]);
          }
        }
      )
      .subscribe();

    // 3. Subscription to profile changes (online/offline status of friends)
    const profilesChannel = supabase
      .channel(`realtime-friends-profiles-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          const updatedProfile = payload.new as Profile;
          
          // Update online status in friends list
          setFriends((prev) =>
            prev.map((f) =>
              f.id === updatedProfile.id
                ? { ...f, is_online: updatedProfile.is_online, last_seen: updatedProfile.last_seen }
                : f
            )
          );

          // Update online status in suggestions list
          setSuggestions((prev) =>
            prev.map((s) =>
              s.id === updatedProfile.id
                ? { ...s, is_online: updatedProfile.is_online }
                : s
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestChannel);
      supabase.removeChannel(friendsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [userId]);

  // Social action wrappers with optimistic updates
  const sendRequest = async (targetUserId: string) => {
    // Optimistically filter suggestions
    setSuggestions((prev) => prev.filter((s) => s.id !== targetUserId));
    const res = await apiSendFriendRequest(targetUserId);
    if (res?.error) {
      // Revert suggestions on error
      fetchData();
      return { error: res.error };
    }
    return { success: true };
  };

  const acceptRequest = async (requestId: string) => {
    // Remove request optimistically
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
    const res = await apiAcceptFriendRequest(requestId);
    if (res?.error) {
      fetchData();
      return { error: res.error };
    }
    // Refresh friends list
    const friendsList = await getFriends();
    setFriends(friendsList as Profile[]);
    return { success: true };
  };

  const rejectRequest = async (requestId: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
    const res = await apiRejectFriendRequest(requestId);
    if (res?.error) {
      fetchData();
      return { error: res.error };
    }
    return { success: true };
  };

  const removeFriendConnection = async (friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    const res = await apiRemoveFriend(friendId);
    if (res?.error) {
      fetchData();
      return { error: res.error };
    }
    return { success: true };
  };

  return {
    friends,
    pendingRequests,
    suggestions,
    isLoading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend: removeFriendConnection,
    refresh: fetchData,
  };
}
