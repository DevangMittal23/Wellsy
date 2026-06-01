"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bell, BellOff, Check, Heart, MessageSquare, UserPlus, Users } from "lucide-react";
import Link from "next/link";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  value: boolean;
  icon: any;
}

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [muteAll, setMuteAll] = useState(false);
  const [savedStatus, setSavedStatus] = useState<string | null>("All changes saved");

  // Load from localStorage on mount
  useEffect(() => {
    const defaultSettings: NotificationSetting[] = [
      {
        id: "likes",
        title: "Likes",
        description: "Get notified when someone likes one of your posts",
        value: true,
        icon: Heart,
      },
      {
        id: "comments",
        title: "Comments",
        description: "Get notified when someone comments on your post",
        value: true,
        icon: MessageSquare,
      },
      {
        id: "messages",
        title: "Direct Messages",
        description: "Get notified when someone sends you a direct message",
        value: true,
        icon: MessageSquare,
      },
      {
        id: "friendRequests",
        title: "Friend Requests",
        description: "Get notified when someone sends you a friend request",
        value: true,
        icon: UserPlus,
      },
      {
        id: "friendAccepts",
        title: "Friend Confirmations",
        description: "Get notified when someone accepts your friend request",
        value: true,
        icon: Users,
      },
    ];

    try {
      const storedMute = localStorage.getItem("wellsy_notifications_mute_all");
      if (storedMute) {
        setMuteAll(JSON.parse(storedMute));
      }

      const stored = localStorage.getItem("wellsy_notification_settings");
      if (stored) {
        setSettings(JSON.parse(stored).map((item: any) => {
          // Re-associate icons since functions/components don't stringify
          const match = defaultSettings.find((ds) => ds.id === item.id);
          return { ...item, icon: match ? match.icon : Bell };
        }));
      } else {
        setSettings(defaultSettings);
        localStorage.setItem("wellsy_notification_settings", JSON.stringify(defaultSettings));
      }
    } catch (e) {
      setSettings(defaultSettings);
    }
  }, []);

  const handleToggle = (id: string) => {
    if (muteAll) return; // Disallow toggles when mute all is active

    setSavedStatus("Saving...");
    const updated = settings.map((s) => {
      if (s.id === id) {
        return { ...s, value: !s.value };
      }
      return s;
    });
    setSettings(updated);

    try {
      localStorage.setItem("wellsy_notification_settings", JSON.stringify(updated));
      setTimeout(() => {
        setSavedStatus("All changes saved");
      }, 600);
    } catch (e) {
      setSavedStatus("Failed to save");
    }
  };

  const handleMuteAllToggle = () => {
    setSavedStatus("Saving...");
    const newMuteAll = !muteAll;
    setMuteAll(newMuteAll);

    try {
      localStorage.setItem("wellsy_notifications_mute_all", JSON.stringify(newMuteAll));
      setTimeout(() => {
        setSavedStatus("All changes saved");
      }, 600);
    } catch (e) {
      setSavedStatus("Failed to save");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
          <p className="text-sm text-text-secondary">
            Configure how and when you want to receive alerts
          </p>
        </div>
      </div>

      {/* Auto-save status */}
      <AnimatePresence mode="wait">
        {savedStatus && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-success uppercase tracking-wider pl-1"
          >
            <Check className="h-3.5 w-3.5" />
            <span>{savedStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {/* Do Not Disturb Toggle */}
        <div className="glass-card p-5 border border-warning/10 bg-warning/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <BellOff className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-text-primary">Mute All Notifications</h3>
                <p className="text-xs leading-relaxed text-text-muted">
                  Temporarily pause all push and in-app alerts (Do Not Disturb)
                </p>
              </div>
            </div>
            {/* Toggle */}
            <button
              onClick={handleMuteAllToggle}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-300 ${
                muteAll ? "bg-warning" : "bg-surface border border-border"
              }`}
              role="switch"
              aria-checked={muteAll}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                  muteAll ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Categories Section */}
        <div className={`glass-card p-5 space-y-6 transition-opacity duration-300 ${muteAll ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4.5 w-4.5 text-accent" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Alert Subscriptions
            </h2>
          </div>

          <div className="space-y-6 divide-y divide-border/40">
            {settings.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-start justify-between gap-4 ${idx > 0 ? "pt-5" : ""}`}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-text-secondary">
                    <item.icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-text-primary">{item.title}</h3>
                    <p className="text-xs leading-relaxed text-text-muted">{item.description}</p>
                  </div>
                </div>
                {/* Switch */}
                <button
                  onClick={() => handleToggle(item.id)}
                  disabled={muteAll}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-300 ${
                    item.value ? "bg-accent" : "bg-surface border border-border"
                  }`}
                  role="switch"
                  aria-checked={item.value}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                      item.value ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
