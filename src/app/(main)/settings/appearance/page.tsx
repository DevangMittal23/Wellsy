"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Palette, Check, Sparkles } from "lucide-react";
import Link from "next/link";

interface ThemeOption {
  id: string;
  name: string;
  background: string;
  secondary: string;
  surface: string;
  surfaceHover: string;
  border: string;
  previewBg: string;
}

interface AccentOption {
  id: string;
  name: string;
  color: string;
  hover: string;
  hex: string;
}

export default function AppearancePage() {
  const [activeTheme, setActiveTheme] = useState("sleek");
  const [activeAccent, setActiveAccent] = useState("purple");
  const [glassEffects, setGlassEffects] = useState(true);
  const [savedStatus, setSavedStatus] = useState<string | null>("All changes saved");

  const themes: ThemeOption[] = [
    {
      id: "sleek",
      name: "Sleek Dark",
      background: "hsl(240 10% 3.9%)",
      secondary: "hsl(240 6% 6%)",
      surface: "hsl(240 6% 10%)",
      surfaceHover: "hsl(240 5% 14%)",
      border: "hsl(240 4% 16%)",
      previewBg: "#09090b",
    },
    {
      id: "amethyst",
      name: "Amethyst Mystique",
      background: "hsl(264 25% 4.5%)",
      secondary: "hsl(264 20% 7%)",
      surface: "hsl(264 18% 11%)",
      surfaceHover: "hsl(264 16% 15%)",
      border: "hsl(264 15% 18%)",
      previewBg: "#0e0918",
    },
    {
      id: "midnight",
      name: "Midnight Ocean",
      background: "hsl(222 35% 4.5%)",
      secondary: "hsl(222 28% 7%)",
      surface: "hsl(222 24% 11%)",
      surfaceHover: "hsl(222 20% 15%)",
      border: "hsl(222 18% 18%)",
      previewBg: "#060913",
    },
    {
      id: "obsidian",
      name: "Pure Obsidian",
      background: "hsl(0 0% 0%)",
      secondary: "hsl(0 0% 3%)",
      surface: "hsl(0 0% 7%)",
      surfaceHover: "hsl(0 0% 11%)",
      border: "hsl(0 0% 14%)",
      previewBg: "#000000",
    },
  ];

  const accents: AccentOption[] = [
    {
      id: "purple",
      name: "Amethyst Violet",
      color: "hsl(263 70% 58%)",
      hover: "hsl(263 70% 65%)",
      hex: "#8b5cf6",
    },
    {
      id: "pink",
      name: "Cyber Rose",
      color: "hsl(340 82% 52%)",
      hover: "hsl(340 82% 58%)",
      hex: "#ec4899",
    },
    {
      id: "teal",
      name: "Cyber Teal",
      color: "hsl(187 90% 42%)",
      hover: "hsl(187 90% 48%)",
      hex: "#06b6d4",
    },
    {
      id: "green",
      name: "Emerald Glow",
      color: "hsl(142 70% 45%)",
      hover: "hsl(142 70% 50%)",
      hex: "#10b981",
    },
    {
      id: "amber",
      name: "Electric Amber",
      color: "hsl(38 90% 50%)",
      hover: "hsl(38 90% 55%)",
      hex: "#f59e0b",
    },
  ];

  // Load configuration on mount
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("wellsy_appearance_theme") || "sleek";
      const storedAccent = localStorage.getItem("wellsy_appearance_accent") || "purple";
      const storedGlass = localStorage.getItem("wellsy_appearance_glass") !== "false";

      setActiveTheme(storedTheme);
      setActiveAccent(storedAccent);
      setGlassEffects(storedGlass);
    } catch (e) {}
  }, []);

  const applyTheme = (themeId: string) => {
    setSavedStatus("Applying...");
    const theme = themes.find((t) => t.id === themeId);
    if (!theme) return;

    setActiveTheme(themeId);
    try {
      localStorage.setItem("wellsy_appearance_theme", themeId);
      
      // Inject CSS properties live
      const root = document.documentElement;
      root.style.setProperty("--color-background", theme.background);
      root.style.setProperty("--color-background-secondary", theme.secondary);
      root.style.setProperty("--color-surface", theme.surface);
      root.style.setProperty("--color-surface-hover", theme.surfaceHover);
      root.style.setProperty("--color-border", theme.border);

      setTimeout(() => setSavedStatus("All changes saved"), 600);
    } catch (e) {
      setSavedStatus("Failed to apply");
    }
  };

  const applyAccent = (accentId: string) => {
    setSavedStatus("Applying...");
    const accent = accents.find((a) => a.id === accentId);
    if (!accent) return;

    setActiveAccent(accentId);
    try {
      localStorage.setItem("wellsy_appearance_accent", accentId);

      // Inject CSS properties live
      const root = document.documentElement;
      root.style.setProperty("--color-accent", accent.color);
      root.style.setProperty("--color-accent-hover", accent.hover);

      setTimeout(() => setSavedStatus("All changes saved"), 600);
    } catch (e) {
      setSavedStatus("Failed to apply");
    }
  };

  const toggleGlass = () => {
    setSavedStatus("Saving...");
    const newGlass = !glassEffects;
    setGlassEffects(newGlass);
    try {
      localStorage.setItem("wellsy_appearance_glass", String(newGlass));
      setTimeout(() => setSavedStatus("All changes saved"), 600);
    } catch (e) {}
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
          <h1 className="text-2xl font-bold text-text-primary">Appearance</h1>
          <p className="text-sm text-text-secondary">
            Personalize the interface design, colors, and layout effects
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

      <div className="space-y-5">
        {/* Theme Selection Section */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="h-4.5 w-4.5 text-accent" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Choose Palette Theme
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {themes.map((theme) => {
              const isSelected = activeTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => applyTheme(theme.id)}
                  className={`flex flex-col items-center gap-2.5 rounded-2xl border p-3.5 text-left transition-all duration-300 active:scale-95 ${
                    isSelected
                      ? "border-accent bg-accent/5 shadow-glow"
                      : "border-border bg-surface/50 hover:bg-surface hover:border-border/80"
                  }`}
                >
                  {/* Miniature Theme Circle View */}
                  <div
                    className="h-14 w-full rounded-xl border border-white/5 shadow-inner flex items-center justify-center relative overflow-hidden"
                    style={{ backgroundColor: theme.previewBg }}
                  >
                    {/* Simulated details inside the preview card */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="h-2 w-2 rounded-full opacity-30" style={{ backgroundColor: "var(--color-accent)" }} />
                      <span className="h-2 w-6 rounded-md opacity-20" style={{ backgroundColor: "var(--color-text-primary)" }} />
                    </div>
                    <div className="h-3 w-10/12 rounded bg-white/5 absolute bottom-2" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-accent/5 flex items-center justify-center backdrop-blur-[0.5px]">
                        <Check className="h-5 w-5 text-accent" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-text-primary text-center truncate w-full">
                    {theme.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Color Selection */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4.5 w-4.5 text-accent" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Select Color Accent
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {accents.map((accent) => {
              const isSelected = activeAccent === accent.id;
              return (
                <button
                  key={accent.id}
                  onClick={() => applyAccent(accent.id)}
                  className={`relative flex items-center justify-center h-11 w-11 rounded-full border transition-all duration-300 active:scale-90 ${
                    isSelected ? "border-white ring-2 ring-accent" : "border-transparent"
                  }`}
                  style={{ backgroundColor: accent.hex }}
                  title={accent.name}
                >
                  {isSelected && (
                    <Check className="h-5 w-5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] animate-scale-in" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Glassmorphic Effects */}
        <div className="glass-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">Glassmorphic Effects</h3>
              <p className="text-xs leading-relaxed text-text-muted">
                Enable dynamic background blurs and satin glass layers on card structures
              </p>
            </div>
            {/* Toggle */}
            <button
              onClick={toggleGlass}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-300 ${
                glassEffects ? "bg-accent" : "bg-surface border border-border"
              }`}
              role="switch"
              aria-checked={glassEffects}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                  glassEffects ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
