"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function FocusPill() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isSignIn = pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");
  const shouldShow = !isHome && !isSignIn;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="focus-pill"
          initial={{ y: -60, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -60, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-70"
        >
          <Link href="/" aria-label="Go to Focus">
            <motion.div
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-full
                         bg-surface-container-high/90 backdrop-blur-md
                         border border-outline-variant/20
                         shadow-[0_4px_24px_rgba(217,185,255,0.08)]
                         hover:shadow-[0_4px_32px_rgba(217,185,255,0.18)]
                         hover:border-secondary/30
                         transition-shadow duration-300 cursor-pointer group"
            >
              {/* Pulsing live dot */}
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                className="text-outline-variant group-hover:text-secondary transition-colors duration-200 -rotate-135"
              >
                <path
                  d="M2 5h6M5 2l3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {/* Label */}
              <span
                className="text-[10px] font-semibold tracking-[0.22em] uppercase
                           text-outline group-hover:text-secondary transition-colors duration-200"
              >
                Focus
              </span>

              {/* Arrow glyph */}
            </motion.div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
