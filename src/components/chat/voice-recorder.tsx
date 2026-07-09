"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, X, Check, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, durationSeconds: number) => void;
}

export function VoiceRecorder({ onSend }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        if (audioChunksRef.current.length > 0) {
          onSend(audioBlob, duration);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Microphone access denied. Please enable microphone permissions in your browser address bar/settings.");
      } else {
        toast.error("Could not access microphone: " + (err.message || "Unknown error"));
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Clear audio chunks so onstop doesn't send
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setDuration(0);
      toast.info("Recording cancelled");
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  return (
    <div className="flex items-center gap-1">
      {isRecording ? (
        <div className="flex items-center gap-2 bg-error/15 border border-error/25 rounded-xl px-3 py-1.5 animate-pulse text-error text-xs font-semibold">
          <Square className="h-3 w-3 fill-current cursor-pointer" onClick={stopRecording} />
          <span>{formatTime(duration)}</span>
          <button
            onClick={cancelRecording}
            className="hover:scale-115 transition-transform ml-1 text-text-muted hover:text-text-primary cursor-pointer"
            title="Cancel"
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={stopRecording}
            className="hover:scale-115 transition-transform text-success cursor-pointer"
            title="Send voice note"
            type="button"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={startRecording}
          className="rounded-lg p-2 text-text-muted hover:bg-surface hover:text-accent transition-colors cursor-pointer focus:outline-none"
          title="Record voice note"
          type="button"
        >
          <Mic className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
