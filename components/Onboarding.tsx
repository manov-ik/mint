"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Zap, ListTodo, Settings2, Check } from "lucide-react";
import { Logo } from "./Logo";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

const STORAGE_KEY = "mint_onboarding_done";

const steps = [
  {
    id: "welcome",
    highlightId: null,
    path: "/",
    icon: null,
    eyebrow: "Welcome to",
    headline: "Mint",
    body: "A minimal, high-performance system for people who are serious about their habits and daily output.",
    cta: "Get Started",
    position: "bottom-center",
  },
  {
    id: "objectives",
    highlightId: "objective-list",
    path: "/",
    icon: ListTodo,
    eyebrow: "Today",
    headline: "Your Daily Objectives",
    body: "This is where your work happens. Tasks move to the bottom as you complete them, keeping your focus clear.",
    cta: "Next",
    position: "bottom-center",
  },
  {
    id: "tasks",
    highlightId: "task-pill",
    path: "/",
    icon: ListTodo,
    eyebrow: "Quick Add",
    headline: "Capture what matters",
    body: "Quickly add tasks for Today, Tomorrow, or Later. Use the tabs in the add menu to switch days.",
    cta: "Next",
    position: "bottom-center",
  },
  {
    id: "protocols-intro",
    highlightId: "protocol-form",
    path: "/protocol",
    icon: Zap,
    eyebrow: "Protocols",
    headline: "Define your habits",
    body: "Create recurring non-negotiables. They automatically appear on your daily list based on your schedule.",
    cta: "Next",
    position: "bottom-center",
  },
  {
    id: "protocols-list",
    highlightId: "protocol-list",
    path: "/protocol",
    icon: Zap,
    eyebrow: "Management",
    headline: "Active Protocols",
    body: "Manage your habits here. Toggle them on/off or reorder them to change how they appear on your daily list.",
    cta: "Next",
    position: "bottom-center",
  },
  {
    id: "settings",
    highlightId: "settings-preferences",
    path: "/settings",
    icon: Settings2,
    eyebrow: "Personalize",
    headline: "Make it yours",
    body: "Customize themes, control rollover behavior, and set your auto-tomorrow cutoff in Settings.",
    cta: "Let's go",
    position: "bottom-center",
  },
];

function Spotlight({ elementId }: { elementId: string | null }) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);
  const lastScrolledId = useRef<string | null>(null);

  useEffect(() => {
    setReady(false);
    if (!elementId) {
      setRect(null);
      return;
    }

    const update = () => {
      const el = document.getElementById(elementId);
      if (el) {
        // Auto-scroll to element if it's the first time we've seen it in this step
        if (lastScrolledId.current !== elementId) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          lastScrolledId.current = elementId;
        }

        const newRect = el.getBoundingClientRect();
        setRect((prev) => {
          if (
            !prev ||
            prev.x !== newRect.x ||
            prev.y !== newRect.y ||
            prev.width !== newRect.width ||
            prev.height !== newRect.height
          ) {
            return newRect;
          }
          return prev;
        });
        setReady(true);
      } else {
        setRect(null);
      }
    };

    const interval = setInterval(update, 16);
    return () => clearInterval(interval);
  }, [elementId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[190] pointer-events-none"
    >
      <svg className="w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <motion.rect
                initial={false}
                animate={{
                  x: rect.x - 12,
                  y: rect.y - 12,
                  width: rect.width + 24,
                  height: rect.height + 24,
                  rx: rect.height > 100 ? 20 : 32,
                  opacity: ready ? 1 : 0,
                }}
                transition={{ type: "spring", stiffness: 250, damping: 28 }}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.95)"
          mask="url(#spotlight-mask)"
          className="backdrop-blur-[3px] transition-all duration-700"
        />
      </svg>
    </motion.div>
  );
}

export function Onboarding() {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isSignedIn) return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      setVisible(true);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (visible && !hasRedirected.current && pathname !== "/") {
      hasRedirected.current = true;
      router.push("/");
    }
  }, [visible, pathname, router]);

  useEffect(() => {
    if (visible && isInitializing) {
      const timer = setTimeout(() => setIsInitializing(false), 2200);
      return () => clearTimeout(timer);
    }
  }, [visible, isInitializing]);

  useEffect(() => {
    if (visible && !isNavigating && !isInitializing) {
      const targetPath = steps[step].path;
      if (pathname !== targetPath) {
        setIsNavigating(true);
        router.push(targetPath);
        // Wait for page transition and layout
        setTimeout(() => setIsNavigating(false), 500);
      }
    }
  }, [step, visible, pathname, router, isNavigating, isInitializing]);

  function next() {
    if (step < steps.length - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }

  function prev() {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }

  function finish() {
    setExiting(true);
    localStorage.setItem(STORAGE_KEY, "1");
    setTimeout(() => {
      setVisible(false);
      router.push("/");
    }, 500);
  }

  if (!visible) return null;

  if (isInitializing) {
    return (
      <div className="fixed inset-0 z-[300] bg-background flex flex-col items-center justify-center gap-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="w-24 h-24 text-secondary"
        >
          <Logo className="text-primary" />
        </motion.div>
        <div className="flex flex-col items-center gap-4">
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-outline-variant/60 ml-1">
            Setting things up for you
          </span>
          <div className="w-40 h-[1.5px] bg-surface-container-highest rounded-full overflow-hidden">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 2.2, ease: "easeInOut" }}
              className="h-full bg-primary"
            />
          </div>
        </div>
      </div>
    );
  }

  const current = steps[step];
  const Icon = current.icon;
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  // Determine card position classes
  const cardPositionClasses = {
    center: "items-center justify-center",
    "top-center": "items-start justify-center p-8 pt-24 md:pt-32",
    "bottom-center": "items-end justify-center p-4 md:p-8 pb-24 md:pb-12",
  }[current.position as "center" | "top-center" | "bottom-center"];

  return (
    <>
      <AnimatePresence mode="wait">
        {!exiting && !isNavigating && (
          <Spotlight
            key={current.highlightId || "none"}
            elementId={current.highlightId}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!exiting && (
          <motion.div
            key="onboarding-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={clsx("fixed inset-0 z-[200] flex", cardPositionClasses)}
          >
            <div className="relative w-full max-w-[300px] md:max-w-[340px] bg-surface-container-high border border-outline-variant/20 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-4 md:gap-6">
              <div className="absolute top-6 right-6 flex items-center gap-4">
                {step > 0 && (
                  <button
                    onClick={prev}
                    disabled={isNavigating}
                    className="text-[10px] font-bold tracking-widest uppercase text-outline-variant hover:text-primary transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Back
                  </button>
                )}
                {!isLast && (
                  <button
                    onClick={finish}
                    className="text-[10px] font-bold tracking-widest uppercase text-outline-variant hover:text-primary transition-colors cursor-pointer"
                  >
                    Skip
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={{
                    enter: (dir: number) => ({
                      x: dir > 0 ? 10 : -10,
                      opacity: 0,
                    }),
                    center: {
                      x: 0,
                      opacity: 1,
                    },
                    exit: (dir: number) => ({
                      x: dir < 0 ? 10 : -10,
                      opacity: 0,
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.15 },
                  }}
                  className="flex flex-col gap-4 md:gap-6"
                >
                  <div className="flex items-start">
                    {isFirst ? (
                      <div className="w-12 h-12 text-secondary">
                        <Logo className="text-primary" />
                      </div>
                    ) : (
                      Icon && (
                        <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                          <Icon size={24} />
                        </div>
                      )
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-outline">
                      {current.eyebrow}
                    </span>
                    <h2 className="text-lg md:text-xl font-semibold text-primary leading-tight">
                      {current.headline}
                    </h2>
                    <p className="text-xs md:text-sm text-outline leading-relaxed">
                      {current.body}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={clsx(
                      "h-1 rounded-full transition-all duration-300",
                      i === step
                        ? "w-6 bg-secondary"
                        : "w-1.5 bg-outline-variant/40",
                    )}
                  />
                ))}
              </div>

              <button
                onClick={next}
                disabled={isNavigating}
                className="w-full py-3 md:py-3.5 flex items-center justify-center gap-2 bg-secondary text-on-secondary rounded-xl font-bold text-xs tracking-[0.1em] uppercase hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isLast ? (
                  <>
                    <Check size={14} strokeWidth={3} />
                    {current.cta}
                  </>
                ) : (
                  <>
                    {current.cta}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
