"use client";

import { useCallback } from "react";
import { useCallStore } from "@/stores/call-store";
import { useAuthStore } from "@/stores/auth-store";
import type { CallType, User } from "@/types";

export function useCall() {
  const { user: currentUser } = useAuthStore();
  const {
    activeCall,
    incomingCall,
    isMuted,
    isCameraOff,
    isScreenSharing,
    setActiveCall,
    setIncomingCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    endCall: resetCallStore,
  } = useCallStore();

  const startCall = useCallback(
    async (conversationId: string, callType: CallType, participants: User[]) => {
      if (!currentUser) return;
      
      const roomName = `room_${conversationId}_${Date.now()}`;
      
      try {
        // Fetch LiveKit room token from API
        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomName,
            conversationId,
            callType,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get call token");
        }

        const { token } = await response.json();
        
        setActiveCall({
          roomName,
          conversationId,
          callType,
          participants,
          token,
        });

        // Set up real-time database signaling / notifications for participants
        // This is handled by sending missed/incoming call notifications via the DB
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const notificationInserts = participants.map((p) => ({
          recipient_id: p.id,
          actor_id: currentUser.id,
          type: "message" as const, // Or custom type
          entity_type: "conversation" as const,
          entity_id: conversationId,
          body: `is calling you (${callType} call)`,
        }));

        await supabase.from("notifications").insert(notificationInserts);

      } catch (err) {
        console.error("Failed to start call", err);
      }
    },
    [currentUser, setActiveCall]
  );

  const joinCall = useCallback(
    async (roomName: string, conversationId: string, callType: CallType, token: string) => {
      setActiveCall({
        roomName,
        conversationId,
        callType,
        participants: [],
        token,
      });
      setIncomingCall(null);
    },
    [setActiveCall, setIncomingCall]
  );

  const rejectIncomingCall = useCallback(async () => {
    if (!incomingCall) return;
    setIncomingCall(null);
  }, [incomingCall, setIncomingCall]);

  const endCall = useCallback(async () => {
    resetCallStore();
  }, [resetCallStore]);

  return {
    activeCall,
    incomingCall,
    isMuted,
    isCameraOff,
    isScreenSharing,
    startCall,
    joinCall,
    rejectIncomingCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
  };
}
