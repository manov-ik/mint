"use client";

import { useApi, API_URL } from "@/lib/api-client";

import { PageContainer } from "@/components/PageContainer";
import { Logo } from "@/components/Logo";
import {
  ChevronRight,
  Archive,
  Eye,
  Clock,
  Download,
  Trash2,
  ArrowRight,
  LogIn,
  LogOut,
  ShieldCheck,
  Zap,
  Palette,
  Bug,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useTheme } from "next-themes";
import { CustomSelect } from "@/components/CustomSelect";

/* ------------------------------------------------------------------ */
/* Toggle                                                              */
/* ------------------------------------------------------------------ */

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={clsx(
        "w-11 h-6 rounded-full relative cursor-pointer border transition-colors duration-300",
        enabled
          ? "bg-secondary border-transparent"
          : "bg-surface-container-highest border-outline-variant/30",
      )}
    >
      <motion.div
        initial={false}
        animate={{ x: enabled ? 23 : 3 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={clsx(
          "absolute top-[3px] w-[16px] h-[16px] rounded-full shadow-sm",
          enabled ? "bg-on-secondary" : "bg-outline-variant",
        )}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated";
  const user = session?.user;
  const router = useRouter();

  const [showCompleted, setShowCompleted] = useState(true);
  const [moveUncompleted, setMoveUncompleted] = useState(true);
  const [autoTomorrowHour, setAutoTomorrowHour] = useState(18);
  const [rolloverThreshold, setRolloverThreshold] = useState(3);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [showBugSuccess, setShowBugSuccess] = useState(false);
  const [bugDescription, setBugDescription] = useState("");
  const [bugCaptcha, setBugCaptcha] = useState<{ q: string; a: number } | null>(
    null,
  );
  const [userCaptchaAnswer, setUserCaptchaAnswer] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [undoClearTimer, setUndoClearTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { fetchApi } = useApi();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Load settings from API
  useEffect(() => {
    setMounted(true);
    async function load() {
      try {
        const res = await fetchApi("/settings", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setShowCompleted(data.showCompleted);
          setMoveUncompleted(data.moveUncompleted);
          setAutoTomorrowHour(data.autoTomorrowHour ?? 18);
          setRolloverThreshold(data.rolloverThreshold ?? 3);
          if (data.theme) setTheme(data.theme);
        }
      } finally {
        setLoadingSettings(false);
      }
    }
    load();
  }, []);

  async function patchSetting(key: string, value: any) {
    await fetchApi("/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
  }

  async function handleClearData() {
    setShowClearModal(true);
  }

  function confirmClear() {
    setShowClearModal(false);

    // Start 4s undo window
    const timerId = setTimeout(async () => {
      await fetchApi("/tasks/clear", { method: "DELETE" });
      setUndoClearTimer(null);
    }, 4000);

    setUndoClearTimer(timerId);
  }

  function cancelUndoClear() {
    if (undoClearTimer) {
      clearTimeout(undoClearTimer);
      setUndoClearTimer(null);
    }
  }

  async function confirmDeleteAccount() {
    setShowDeleteModal(false);
    try {
      const res = await fetchApi("/settings", { method: "DELETE" });
      if (res.ok) {
        signOut({ callbackUrl: "/sign-in" });
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } catch (e) {
      alert("An error occurred while deleting your account.");
    }
  }

  function handleOpenBugModal() {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setBugCaptcha({ q: `${n1} + ${n2}`, a: n1 + n2 });
    setUserCaptchaAnswer("");
    setShowBugModal(true);
  }

  async function handleSendReport() {
    if (!bugDescription.trim()) return;

    setIsSubmittingReport(true);
    try {
      const metadata = {
        userAgent: navigator.userAgent,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        url: window.location.href,
        theme: theme,
        language: navigator.language,
        isOnline: navigator.onLine,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: new Date().toISOString(),
      };

      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: bugDescription,
          email: user?.email,
          honeypot, // Send the honeypot value
          metadata,
        }),
      });

      setBugDescription("");
      setUserCaptchaAnswer("");
      setShowBugModal(false);

      // Show success toast
      setShowBugSuccess(true);
      setTimeout(() => setShowBugSuccess(false), 3000);
    } finally {
      setIsSubmittingReport(false);
    }
  }

  return (
    <PageContainer>
      <div className="mb-12">
        <h1 className="text-headline-xl italic mb-4">Settings</h1>
        <p className="text-body-base text-on-surface-variant max-w-md">
          Application Preferences
        </p>
      </div>

      {/* Account Section */}
      <section className="mb-10">
        <h2 className="text-[10px] font-semibold text-outline tracking-[0.15em] uppercase mb-4 px-2">
          Account
        </h2>
        <div className="bg-surface-container rounded-lg border border-outline-variant/10 overflow-hidden flex flex-col">
          {isSignedIn && user ? (
            <>
              {/* Signed in — show username and sign out */}
              <div className="flex items-center justify-between p-5 border-b border-outline-variant/10">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary text-sm font-medium shrink-0 uppercase">
                    {user.name?.[0] ?? "?"}
                  </div>
                  <div>
                    <div className="text-primary font-medium text-sm">
                      {user.name}
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="flex items-center justify-between p-5 hover:bg-surface-container-high transition-colors cursor-pointer group border-b border-outline-variant/10"
                onClick={() => signOut({ callbackUrl: "/sign-in" })}
              >
                <div className="flex items-center gap-4">
                  <LogOut
                    className="text-outline-variant group-hover:text-primary transition-colors"
                    size={20}
                  />
                  <div className="text-primary font-medium">Sign Out</div>
                </div>
              </div>
              <div
                className="flex items-center justify-between p-5 hover:bg-surface-container-high transition-colors cursor-pointer group"
                onClick={() => setShowDeleteModal(true)}
              >
                <div className="flex items-center gap-4">
                  <Trash2
                    className="text-error/80 group-hover:text-error transition-colors"
                    size={20}
                  />
                  <div className="text-error/90 group-hover:text-error font-medium transition-colors">
                    Delete Account
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              className="flex items-center justify-between p-5 hover:bg-surface-container-high transition-colors cursor-pointer group"
              onClick={() => router.push("/sign-in")}
            >
              <div className="flex items-center gap-4">
                <LogIn
                  className="text-outline-variant group-hover:text-primary transition-colors"
                  size={20}
                />
                <div className="text-primary font-medium">Sign In</div>
              </div>
              <ChevronRight
                className="text-outline-variant group-hover:text-primary transition-colors"
                size={18}
              />
            </div>
          )}
        </div>
      </section>

      {/* Preferences Section */}
      <section id="settings-preferences" className="mb-10">
        <h2 className="text-[10px] font-semibold text-outline tracking-[0.15em] uppercase mb-4 px-2">
          Preferences
        </h2>
        <div className="bg-surface-container rounded-lg border border-outline-variant/10 flex flex-col [&>div]:border-b [&>div]:border-outline-variant/10 [&>div:last-child]:border-b-0 [&>div:first-child]:rounded-t-[15px] [&>div:last-child]:rounded-b-[15px]">
          <div
            className="flex items-center justify-between p-5 hover:bg-surface-container-high transition-colors cursor-pointer group"
            onClick={() => {
              const next = !moveUncompleted;
              setMoveUncompleted(next);
              patchSetting("moveUncompleted", next);
            }}
          >
            <div className="flex items-center gap-4">
              <ArrowRight
                className="text-outline-variant group-hover:text-primary transition-colors"
                size={20}
              />
              <div>
                <div className="text-primary font-medium mb-1">
                  Rollover Tasks
                </div>
                <div className="text-[11px] text-outline">
                  Move uncompleted tasks to next day
                </div>
              </div>
            </div>
            <Toggle
              enabled={!loadingSettings && moveUncompleted}
              onChange={() => {
                const next = !moveUncompleted;
                setMoveUncompleted(next);
                patchSetting("moveUncompleted", next);
              }}
            />
          </div>

          <div
            className="flex items-center justify-between p-5 hover:bg-surface-container-high transition-colors cursor-pointer group"
            onClick={() => {
              const next = !showCompleted;
              setShowCompleted(next);
              patchSetting("showCompleted", next);
            }}
          >
            <div className="flex items-center gap-4">
              <Eye
                className="text-outline-variant group-hover:text-primary transition-colors"
                size={20}
              />
              <div>
                <div className="text-primary font-medium mb-1">
                  Show Completed Tasks
                </div>
                <div className="text-[11px] text-outline ">
                  Show completed tasks in the list
                </div>
              </div>
            </div>
            <Toggle
              enabled={!loadingSettings && showCompleted}
              onChange={() => {
                const next = !showCompleted;
                setShowCompleted(next);
                patchSetting("showCompleted", next);
              }}
            />
          </div>

          <div className="flex items-center justify-between p-5 hover:bg-surface-container-high transition-colors group">
            <div className="flex items-center gap-4">
              <Clock
                className="text-outline-variant group-hover:text-primary transition-colors"
                size={20}
              />
              <div>
                <div className="text-primary font-medium mb-1">
                  Auto-Tomorrow Cutoff
                </div>
                <div className="text-[11px] text-outline">
                  Tasks added after this hour default to tomorrow
                </div>
              </div>
            </div>
            <CustomSelect
              value={autoTomorrowHour}
              onChange={(val) => {
                const numVal = parseInt(val as string);
                setAutoTomorrowHour(numVal);
                patchSetting("autoTomorrowHour", numVal);
              }}
              options={[...Array(24)].map((_, i) => ({
                value: i,
                label:
                  i === 0
                    ? "12 AM"
                    : i < 12
                      ? `${i} AM`
                      : i === 12
                        ? "12 PM"
                        : `${i - 12} PM`,
              }))}
            />
          </div>

          <div className="flex items-center justify-between p-5 hover:bg-surface-container-high transition-colors group">
            <div className="flex items-center gap-4">
              <Archive
                className="text-outline-variant group-hover:text-primary transition-colors"
                size={20}
              />
              <div>
                <div className="text-primary font-medium mb-1">
                  Rollover Warning Badge
                </div>
                <div className="text-[11px] text-outline">
                  Days overdue before showing warning
                </div>
              </div>
            </div>
            <CustomSelect
              value={rolloverThreshold}
              onChange={(val) => {
                const numVal = parseInt(val as string);
                setRolloverThreshold(numVal);
                patchSetting("rolloverThreshold", numVal);
              }}
              options={[1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30].map((days) => ({
                value: days,
                label: `${days} ${days === 1 ? "day" : "days"}`,
              }))}
            />
          </div>

          <div className="flex items-center justify-between p-5 hover:bg-surface-container-high transition-colors group">
            <div className="flex items-center gap-4">
              <Palette
                className="text-outline-variant group-hover:text-primary transition-colors"
                size={20}
              />
              <div>
                <div className="text-primary font-medium mb-1">App Theme</div>
                <div className="text-[11px] text-outline">
                  Select your preferred color scheme
                </div>
              </div>
            </div>
            {mounted ? (
              <CustomSelect
                value={theme || "dark"}
                onChange={(val) => {
                  setTimeout(() => setTheme(val as string), 150);
                  patchSetting("theme", val);
                }}
                options={[
                  { label: "Dark", value: "dark", color: "#131313" },
                  { label: "Light", value: "light", color: "#ffffff" },
                  {
                    label: "OLED",
                    value: "oled",
                    color: "#000000",
                  },
                  {
                    label: "Day",
                    value: "day",
                    color: "#d5d6db",
                  },
                  {
                    label: "Night",
                    value: "night",
                    color: "#1a1b26",
                  },
                  {
                    label: "Storm",
                    value: "storm",
                    color: "#24283b",
                  },
                  {
                    label: "Gruvbox",
                    value: "gruvbox",
                    color: "#1d2021",
                  },
                ]}
              />
            ) : (
              <div className="w-[110px] h-[34px] bg-surface-container-highest border border-outline-variant/30 rounded-lg animate-pulse" />
            )}
          </div>
        </div>
      </section>

      {/* Data Section */}
      <section className="mb-10">
        <h2 className="text-[10px] font-semibold text-outline tracking-[0.15em] uppercase mb-4 px-2">
          Data & Sync
        </h2>
        <div className="bg-surface-container rounded-lg border border-outline-variant/10 overflow-hidden flex flex-col">
          <div
            className="flex items-center justify-between p-5 border-b border-outline-variant/10 hover:bg-surface-container-high transition-colors cursor-pointer group"
            onClick={() => {
              window.location.href = `${API_URL}/export`;
            }}
          >
            <div className="flex items-center gap-4">
              <Download
                className="text-outline-variant group-hover:text-primary transition-colors"
                size={20}
              />
              <div className="text-primary font-medium">
                Export Archive (.csv)
              </div>
            </div>
            <ChevronRight
              className="text-outline-variant group-hover:text-primary transition-colors"
              size={18}
            />
          </div>

          <div
            className="flex items-center justify-between p-5 hover:bg-surface-container-high transition-colors cursor-pointer group"
            onClick={handleClearData}
          >
            <div className="flex items-center gap-4">
              <Trash2
                className="text-error/80 group-hover:text-error transition-colors"
                size={20}
              />
              <div className="text-error/90 group-hover:text-error font-medium transition-colors">
                Clear All Data
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="mb-12">
        <h2 className="text-[10px] font-semibold text-outline tracking-[0.15em] uppercase mb-4 px-2">
          About
        </h2>
        <div className="bg-surface-container rounded-lg border border-outline-variant/10 overflow-hidden flex flex-col">
          <div
            className="flex items-center justify-between p-5 hover:bg-surface-container-high transition-colors cursor-pointer group"
            onClick={() => router.push("/about")}
          >
            <div className="flex items-center gap-4">
              <div className="w-5 h-5 transition-all shrink-0">
                <Logo className="text-outline-variant group-hover:text-primary transition-colors" />
              </div>
              <div className="text-primary font-medium">About Us</div>
            </div>
            <ChevronRight
              className="text-outline-variant group-hover:text-primary transition-colors"
              size={18}
            />
          </div>
        </div>
      </section>

      <div className="h-4" />

      <div className="text-center">
        <div className="text-xs font-bold text-outline-variant/90 tracking-[0.3em] uppercase">
          V 1.0.0 - MINT
        </div>
      </div>
      {/* ── Confirm Clear Modal ── */}
      <AnimatePresence>
        {showClearModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-surface-container rounded-2xl border border-outline-variant/20 p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-medium text-primary mb-2">
                Delete Everything?
              </h3>
              <p className="text-sm text-outline mb-8">
                This will permanently erase all your tasks and protocol records.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmClear}
                  className="w-full py-4 bg-error text-on-error rounded-xl font-bold uppercase tracking-[0.2em] text-xs"
                >
                  Yes, Clear All Data
                </button>
                <button
                  onClick={() => setShowClearModal(false)}
                  className="w-full py-4 text-outline hover:text-primary transition-colors text-xs font-semibold uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Confirm Delete Account Modal ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-surface-container rounded-2xl border border-outline-variant/20 p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-medium text-primary mb-2">
                Delete Account?
              </h3>
              <p className="text-sm text-outline mb-8">
                This will permanently delete your account and erase all your
                task, protocol, and setting records from the database. This
                action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDeleteAccount}
                  className="w-full py-4 bg-error text-on-error rounded-xl font-bold uppercase tracking-[0.2em] text-xs cursor-pointer"
                >
                  Yes, Delete My Account
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-4 text-outline hover:text-primary transition-colors text-xs font-semibold uppercase tracking-widest cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Undo Clear Toast ── */}
      <AnimatePresence>
        {undoClearTimer && (
          <motion.div
            key="undo-clear-toast"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            onClick={cancelUndoClear}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[110] pointer-events-auto cursor-pointer"
          >
            <div
              className="flex items-center gap-6 px-8 py-5 rounded-2xl
                            bg-surface-container-high/95 backdrop-blur-md shadow-2xl
                            min-w-[320px] max-w-[400px] overflow-hidden relative border border-outline-variant/20"
            >
              {/* Shrinking timer bar at the bottom edge */}
              <motion.div
                className="absolute bottom-0 left-0 h-[3px] bg-secondary/50 rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
              />

              <span className="text-base text-primary font-medium flex-1">
                Data cleared...
              </span>

              <span className="text-xs font-bold tracking-[0.25em] uppercase text-secondary shrink-0">
                Undo
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── Bug Report Modal ── */}
      <AnimatePresence>
        {showBugModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmittingReport && setShowBugModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-surface-container rounded-2xl border border-outline-variant/20 p-8 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mx-auto mb-6">
                <Bug size={32} />
              </div>
              <h3 className="text-xl font-medium text-primary mb-2 text-center">
                Report a Bug
              </h3>
              <p className="text-sm text-outline mb-6 text-center">
                What went wrong? Our team will look into it.
              </p>

              <textarea
                value={bugDescription}
                onChange={(e) => setBugDescription(e.target.value)}
                placeholder="Describe the issue..."
                className="w-full h-32 bg-background border border-outline-variant/20 rounded-xl p-4 text-sm text-primary placeholder:text-outline-variant/50 focus:outline-none focus:border-secondary/50 transition-colors mb-4 resize-none"
                autoFocus
              />

              <div className="flex items-center gap-3 mb-6 px-1">
                <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-outline shrink-0">
                  Verify: {bugCaptcha?.q} =
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={userCaptchaAnswer}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setUserCaptchaAnswer(val);
                  }}
                  placeholder="?"
                  className="w-16 bg-background border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs text-center text-primary focus:outline-none focus:border-secondary/50 transition-colors"
                />

                {/* Honeypot field (hidden from humans) */}
                <input
                  type="text"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="absolute opacity-0 -z-50 pointer-events-none w-0 h-0"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSendReport}
                  disabled={
                    isSubmittingReport ||
                    !bugDescription.trim() ||
                    parseInt(userCaptchaAnswer) !== bugCaptcha?.a
                  }
                  className="w-full py-4 bg-secondary text-on-secondary rounded-xl font-bold uppercase tracking-[0.2em] text-xs disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {isSubmittingReport ? "Sending..." : "Submit Report"}
                </button>
                <button
                  onClick={() => setShowBugModal(false)}
                  disabled={isSubmittingReport}
                  className="w-full py-2 text-outline hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest"
                >
                  Go Back
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Bug Success Toast ── */}
      <AnimatePresence>
        {showBugSuccess && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[110]"
          >
            <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-secondary text-on-secondary shadow-2xl border border-white/10">
              <Bug size={18} />
              <span className="text-sm font-bold tracking-widest uppercase">
                Report Sent
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
