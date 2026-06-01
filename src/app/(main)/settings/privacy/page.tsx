"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Eye, MessageSquare, KeyRound, Check } from "lucide-react";
import Link from "next/link";

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  value: boolean;
}

export default function PrivacyPage() {
  const [settings, setSettings] = useState<PrivacySetting[]>([]);
  const [savedStatus, setSavedStatus] = useState<string | null>("All changes saved");

  // Load from localStorage on mount
  useEffect(() => {
    const defaultSettings: PrivacySetting[] = [
      {
        id: "privateProfile",
        title: "Private Profile",
        description: "Only approved friends can view your posts, media, and digital core",
        value: false,
      },
      {
        id: "showOnlineStatus",
        title: "Show Active Status",
        description: "Allow your friends to see when you are active or last online",
        value: true,
      },
      {
        id: "readReceipts",
        title: "Read Receipts",
        description: "Let others know when you have read their direct messages",
        value: true,
      },
      {
        id: "restrictDMs",
        title: "Restrict Direct Messages",
        description: "Only accept new conversation requests from friends and followers",
        value: false,
      },
    ];

    try {
      const stored = localStorage.getItem("wellsy_privacy_settings");
      if (stored) {
        setSettings(JSON.parse(stored));
      } else {
        setSettings(defaultSettings);
        localStorage.setItem("wellsy_privacy_settings", JSON.stringify(defaultSettings));
      }
    } catch (e) {
      setSettings(defaultSettings);
    }
  }, []);

  const handleToggle = (id: string) => {
    setSavedStatus("Saving...");
    const updated = settings.map((s) => {
      if (s.id === id) {
        return { ...s, value: !s.value };
      }
      return s;
    });
    setSettings(updated);

    try {
      localStorage.setItem("wellsy_privacy_settings", JSON.stringify(updated));
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
          <h1 className="text-2xl font-bold text-text-primary">Privacy & Security</h1>
          <p className="text-sm text-text-secondary">
            Control your privacy settings and secure your data
          </p>
        </div>
      </div>

      {/* Auto-save badge */}
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
        {/* Profile Visibility card */}
        <div className="glass-card p-5 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4.5 w-4.5 text-accent" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Visibility & Interactions
            </h2>
          </div>

          <div className="space-y-6 divide-y divide-border/40">
            {settings.slice(0, 3).map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-start justify-between gap-4 ${idx > 0 ? "pt-5" : ""}`}
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-text-primary">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-text-muted">{item.description}</p>
                </div>
                {/* iOS Premium Switch */}
                <button
                  onClick={() => handleToggle(item.id)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-300 ${
                    item.value ? "bg-accent" : "bg-surface-hover border border-border"
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

        {/* Messaging & DMs card */}
        <div className="glass-card p-5 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4.5 w-4.5 text-accent" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Conversations
            </h2>
          </div>

          {settings.slice(3).map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-text-primary">{item.title}</h3>
                <p className="text-xs leading-relaxed text-text-muted">{item.description}</p>
              </div>
              <button
                onClick={() => handleToggle(item.id)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-300 ${
                  item.value ? "bg-accent" : "bg-surface-hover border border-border"
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

        {/* Security & Access (Coming soon but styled premium) */}
        <div className="glass-card p-5 space-y-5 opacity-70">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4.5 w-4.5 text-text-secondary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Login & Authentication
            </h2>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-secondary">
                Two-Factor Authentication (2FA)
              </h3>
              <p className="text-xs leading-relaxed text-text-muted">
                Add an extra layer of protection to secure your account credentials
              </p>
            </div>
            <span className="rounded-full bg-surface border border-border/55 px-2.5 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Coming soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
