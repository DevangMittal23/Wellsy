"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { PulseType } from "@/types";
import { PULSE_CONFIG } from "@/types";

interface PulsePickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPulse: PulseType | null;
  onSetPulse: (type: PulseType) => void;
  onClearPulse: () => void;
}

export function PulsePicker({
  isOpen,
  onClose,
  currentPulse,
  onSetPulse,
  onClearPulse,
}: PulsePickerProps) {
  const handleSelect = async (type: PulseType) => {
    onSetPulse(type);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute bottom-full left-0 mb-3 z-50 
                       bg-[#111116] border border-white/10 rounded-2xl p-2
                       shadow-2xl min-w-[200px]"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <p className="text-xs text-text-muted px-3 py-2 font-medium">
              Set your Pulse
            </p>
            {(Object.keys(PULSE_CONFIG) as PulseType[]).map((type) => {
              const config = PULSE_CONFIG[type];
              const isActive = currentPulse === type;
              return (
                <motion.button
                  key={type}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelect(type)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                             transition-colors cursor-pointer ${
                               isActive
                                 ? "bg-white/[0.06]"
                                 : "hover:bg-white/[0.04]"
                             }`}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: config.color,
                      boxShadow: `0 0 8px ${config.glowColor}`,
                    }}
                  />
                  <span className="text-sm text-white">
                    {config.label} {config.emoji}
                  </span>
                  {isActive && (
                    <span className="ml-auto text-xs text-purple-400">
                      Active
                    </span>
                  )}
                </motion.button>
              );
            })}
            {currentPulse && (
              <button
                onClick={() => {
                  onClearPulse();
                  onClose();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/[0.04]
                           text-xs text-text-muted mt-1 border-t border-white/[0.06] cursor-pointer"
              >
                Clear Pulse
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

