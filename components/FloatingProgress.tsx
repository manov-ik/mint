"use client";

import { motion } from "framer-motion";

interface FloatingProgressProps {
  completed: number;
  total: number;
}

export function FloatingProgress({ completed, total }: FloatingProgressProps) {
  if (total === 0) return null;

  const pct = completed / total;
  const radius = 26;
  const stroke = 2.5;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * pct;

  return (
    <div
      className="fixed bottom-8 right-8 z-[60] flex flex-col items-center gap-1 select-none pointer-events-none"
      aria-label={`${completed} of ${total} tasks completed`}
    >
      <svg
        width={64}
        height={64}
        viewBox="0 0 64 64"
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={32}
          cy={32}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-outline-variant/20"
        />
        {/* Fill */}
        <motion.circle
          cx={32}
          cy={32}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="stroke-secondary"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference - dash }}
          initial={{ strokeDashoffset: circumference }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
        />
      </svg>
      {/* Label inside the ring */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[13px] font-semibold text-primary leading-none">
          {completed}
        </span>
        <span className="text-[9px] font-bold tracking-widest text-outline uppercase leading-none mt-0.5">
          /{total}
        </span>
      </div>
    </div>
  );
}
