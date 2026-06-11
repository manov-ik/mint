"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Menu, X } from "lucide-react";
import clsx from "clsx";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useMeasure from "react-use-measure";

import { Logo } from "./Logo";

const NAV_LINKS = [
  { name: "FOCUS", href: "/" },
  { name: "HISTORY", href: "/history" },
  { name: "PROTOCOL", href: "/protocol" },
  { name: "SETTINGS", href: "/settings" },
];

const SPRING = { type: "spring", stiffness: 360, damping: 30 } as const;

export function FloatingNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Measures the real pixel height of the open panel content
  const [contentRef, { height: contentHeight }] = useMeasure();

  // Closed pill = 56×56. Open = 256 wide, content height + padding
  const PADDING = 24; // p-6
  const targetHeight = isOpen ? contentHeight + PADDING * 2 : 56;
  const targetWidth = isOpen ? 256 : 56;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up")) {
    return null;
  }

  return (
    <div ref={navRef} id="nav-pill" className="fixed bottom-8 left-8 z-[60]">
      <motion.div
        animate={{
          width: targetWidth,
          height: targetHeight,
          borderRadius: isOpen ? 24 : 28,
        }}
        transition={SPRING}
        className={clsx(
          "bg-surface-container-high/95 backdrop-blur-md border border-outline-variant/30 overflow-hidden flex flex-col shadow-2xl relative",
          !isOpen && "cursor-pointer hover:bg-surface-container-highest",
        )}
        onClick={() => !isOpen && setIsOpen(true)}
      >
        {/* Closed icon */}
        <AnimatePresence initial={false}>
          {!isOpen && (
            <motion.div
              key="icon"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center text-primary"
            >
              <Menu size={24} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Open content — always rendered so useMeasure can read height */}
        {/* Invisible + non-interactive when closed so it doesn't bleed through the pill */}
        <div
          className={clsx(
            "absolute inset-0 p-6 flex flex-col",
            !isOpen && "pointer-events-none",
          )}
        >
          <motion.div
            ref={contentRef}
            animate={{ opacity: isOpen ? 1 : 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="text-body-base font-semibold tracking-wider text-primary flex items-center gap-2">
                <Logo className="w-3.5 h-3.5 text-primary" />
                mint
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="text-outline hover:text-primary transition-colors"
                aria-label="Close Navigation"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                    }}
                    className={clsx(
                      "text-label-caps transition-colors flex items-center gap-3",
                      isActive
                        ? "text-primary"
                        : "text-outline hover:text-primary",
                    )}
                  >
                    {isActive ? (
                      <motion.div
                        layoutId="activeDot"
                        className="w-1.5 h-1.5 rounded-full bg-secondary"
                      />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                    )}
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
