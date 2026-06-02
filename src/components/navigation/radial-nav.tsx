"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  PenSquare,
  Compass,
  MessageCircle,
  Bell,
  Settings,
  X,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

// ─── Menu Items ───────────────────────────────────────
const RADIAL_ITEMS = [
  {
    icon: PenSquare,
    label: "New Post",
    href: "/feed",
    action: "create-post",
    color: "hsl(263 70% 58%)",
  },
  {
    icon: Compass,
    label: "Galaxy",
    href: "/discover",
    action: "navigate",
    color: "hsl(290 65% 55%)",
  },
  {
    icon: MessageCircle,
    label: "Messages",
    href: "/chat",
    action: "navigate",
    color: "hsl(200 80% 55%)",
  },
  {
    icon: Bell,
    label: "Alerts",
    href: "/notifications",
    action: "navigate",
    color: "hsl(38 92% 50%)",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/settings/profile",
    action: "navigate",
    color: "hsl(160 60% 45%)",
  },
];

// Arc configuration
const ARC_START = -90; // degrees (straight up from center)
const ARC_SPAN = 180; // semicircle spanning left
const RADIUS = 90; // px from center

export function RadialNav() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleItemClick = useCallback(
    (item: (typeof RADIAL_ITEMS)[0]) => {
      setIsOpen(false);
      if (item.action === "navigate") {
        router.push(item.href);
      }
      // For "create-post", we could emit an event or open a modal
      // For now, navigate to feed
      if (item.action === "create-post") {
        router.push(item.href);
      }
    },
    [router]
  );

  // Calculate position of each item along the arc
  const getItemPosition = (index: number) => {
    const count = RADIAL_ITEMS.length;
    const angleDeg = ARC_START + (ARC_SPAN / (count - 1)) * index;
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: Math.cos(angleRad) * RADIUS,
      y: Math.sin(angleRad) * RADIUS,
    };
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-24 right-5 z-50 lg:bottom-8 lg:right-8"
    >
      {/* Radial Items */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 -z-10 bg-background/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Connection lines */}
            <svg
              className="pointer-events-none absolute bottom-0 right-0 -z-[1]"
              width={RADIUS * 2 + 60}
              height={RADIUS * 2 + 60}
              style={{
                transform: `translate(${RADIUS + 30}px, ${RADIUS + 30}px)`,
              }}
            >
              {RADIAL_ITEMS.map((_, index) => {
                const pos = getItemPosition(index);
                return (
                  <motion.line
                    key={index}
                    x1={0}
                    y1={0}
                    x2={-pos.x}
                    y2={-pos.y}
                    stroke="rgba(139, 92, 246, 0.15)"
                    strokeWidth={1}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ pathLength: 0, opacity: 0 }}
                    transition={{
                      delay: index * 0.05,
                      duration: 0.3,
                      ease: "easeOut",
                    }}
                  />
                );
              })}
            </svg>

            {/* Radial Buttons */}
            {RADIAL_ITEMS.map((item, index) => {
              const pos = getItemPosition(index);
              const Icon = item.icon;

              return (
                <motion.button
                  key={item.label}
                  initial={{
                    scale: 0,
                    x: 0,
                    y: 0,
                    opacity: 0,
                  }}
                  animate={{
                    scale: 1,
                    x: -pos.x,
                    y: -pos.y,
                    opacity: 1,
                  }}
                  exit={{
                    scale: 0,
                    x: 0,
                    y: 0,
                    opacity: 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 18,
                    mass: 0.8,
                    delay: index * 0.04,
                  }}
                  onClick={() => handleItemClick(item)}
                  className="absolute bottom-0 right-0 flex flex-col items-center gap-1"
                  title={item.label}
                >
                  {/* Icon circle */}
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-shadow duration-200"
                    style={{
                      background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`,
                      boxShadow: `0 4px 15px ${item.color}40`,
                    }}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </motion.div>

                  {/* Label */}
                  <motion.span
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 + 0.15 }}
                    className="text-[10px] font-medium text-text-secondary"
                  >
                    {item.label}
                  </motion.span>
                </motion.button>
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* FAB Trigger Button */}
      <motion.button
        onClick={toggleMenu}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-shadow duration-300"
        style={{
          background: isOpen
            ? "linear-gradient(135deg, hsl(0 84% 60%), hsl(0 70% 50%))"
            : "linear-gradient(135deg, hsl(263 70% 58%), hsl(290 65% 55%))",
          boxShadow: isOpen
            ? "0 4px 20px rgba(239,68,68,0.3)"
            : "0 4px 25px rgba(139,92,246,0.35), 0 0 40px rgba(139,92,246,0.1)",
        }}
        aria-label={isOpen ? "Close quick menu" : "Open quick menu"}
        aria-expanded={isOpen}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Zap className="h-6 w-6 text-white" />
          )}
        </motion.div>

        {/* Pulse ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full animate-[pulse-glow_3s_ease-in-out_infinite]" />
        )}
      </motion.button>
    </div>
  );
}
