"use client";

import { useEffect, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import { useCall } from "@/hooks/use-call";
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff } from "lucide-react";
import { toast } from "sonner";

export function CallRoom() {
  const { activeCall, endCall } = useCall();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!activeCall || !mounted) return null;

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://your-livekit-cloud-url.livekit.cloud";

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center">
      <LiveKitRoom
        video={activeCall.callType === "video"}
        audio={true}
        token={activeCall.token}
        serverUrl={serverUrl}
        onDisconnected={endCall}
        className="w-full h-full flex flex-col justify-between"
      >
        {/* Call Info Overlay */}
        <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur px-3 py-1.5 rounded-lg text-white border border-white/10">
          <span className="text-xs font-semibold">Active Call: {activeCall.roomName}</span>
        </div>

        {/* Video grid or voice call layout */}
        <div className="flex-1 flex items-center justify-center p-4">
          {activeCall.callType === "video" ? (
            <div className="text-white text-xs opacity-60">Connecting Video Stream...</div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-24 w-24 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center text-accent text-3xl font-bold animate-pulse">
                🎙️
              </div>
              <div className="text-white">
                <h4 className="font-bold text-lg">Voice Call</h4>
                <p className="text-xs opacity-60">Connected to room</p>
              </div>
            </div>
          )}
        </div>

        {/* Room audio rendering */}
        <RoomAudioRenderer />

        {/* Controls Bar */}
        <div className="bg-neutral-900 border-t border-neutral-800 p-6 flex justify-center items-center gap-4 shrink-0">
          <button
            onClick={endCall}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-error text-white hover:scale-105 transition-transform cursor-pointer shadow-lg shadow-error/20"
            title="End Call"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </LiveKitRoom>
    </div>
  );
}
