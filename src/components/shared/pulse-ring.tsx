"use client";

import { motion } from "framer-motion";
import type { PulseType } from "@/types";
import { PULSE_CONFIG } from "@/types";

interface PulseRingProps {
  pulseType: PulseType | null | undefined;
  size: number; // matches the avatar size in px
  children: React.ReactNode;
}

export function PulseRing({ pulseType, size, children }: PulseRingProps) {
  if (!pulseType) {
    return <div style={{ width: size, height: size }}>{children}</div>;
  }

  const config = PULSE_CONFIG[pulseType];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer glow ring - animated */}
      <motion.div
        className="absolute inset-[-3px] rounded-full"
        style={{
          border: `2px solid ${config.color}`,
          boxShadow: `0 0 12px ${config.glowColor}`,
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          type: "keyframes",
          duration: parseFloat(config.animationSpeed),
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Avatar content */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
