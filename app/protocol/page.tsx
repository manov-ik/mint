"use client";

import { useApi } from "@/lib/api-client";

import { PageContainer } from "@/components/PageContainer";
import {
  AlignLeft,
  Utensils,
  Dumbbell,
  BookOpen,
  Zap,
  Droplet,
  GripVertical,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import clsx from "clsx";
import { useState, useEffect, useCallback } from "react";
import { Reorder, useDragControls, motion, AnimatePresence } from "framer-motion";
import { getRandomQuote } from "@/lib/quotes";
import { useLongPress } from "@/lib/use-long-press";
import { EditProtocolModal } from "@/components/EditProtocolModal";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Protocol {
  id: string;
  title: string;
  duration: string;
  icon: string;
  sortOrder: number;
  frequency: string[];
  repeatEvery?: number | null;
  isActive: boolean;
}

const ICON_MAP = {
  Zap,
  AlignLeft,
  Utensils,
  Dumbbell,
  BookOpen,
  Droplet,
};

type IconName = keyof typeof ICON_MAP;

const ORDERED_DAYS = ["M", "T", "W", "Th", "F", "Sa", "Su"];

function formatFreq(freq: string[], repeatEvery?: number | null): string {
  if (repeatEvery && repeatEvery > 0) return `Every ${repeatEvery}d`;
  if (!freq || freq.length === 0) return "";
  if (freq.length === 7) return "Daily";
  if (
    freq.length === 5 &&
    ORDERED_DAYS.slice(0, 5).every((d) => freq.includes(d))
  )
    return "Weekdays";
  return ORDERED_DAYS.filter((d) => freq.includes(d)).join(" · ");
}

/* ------------------------------------------------------------------ */
/* Protocol Item                                                       */
/* ------------------------------------------------------------------ */

function ProtocolItem({
  protocol,
  onDelete,
  onToggle,
  onEdit,
}: {
  protocol: Protocol;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  onEdit: () => void;
}) {
  const controls = useDragControls();

  const longPressProps = useLongPress(() => {
    onEdit();
  });

  return (
    <Reorder.Item
      value={protocol}
      dragListener={false}
      dragControls={controls}
      {...longPressProps}
      className="flex items-center gap-4 p-5 rounded-xl bg-surface-container border border-outline-variant/10 group hover:bg-surface-container-high transition-colors relative"
    >
      <div
        className="cursor-move p-1 -ml-1 text-outline-variant/30 group-hover:text-outline-variant transition-colors"
        onPointerDown={(e) => controls.start(e)}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{ touchAction: "none" }}
      >
        <GripVertical size={20} />
      </div>
      <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center text-secondary shrink-0">
        {(() => {
          const Icon = ICON_MAP[protocol.icon as IconName] || Zap;
          return <Icon size={20} />;
        })()}
      </div>
      <div className="flex-1 min-w-0">
        <h3
          className={clsx(
            "font-medium mb-1 transition-colors truncate",
            protocol.isActive ? "text-primary" : "text-outline",
          )}
        >
          {protocol.title}
        </h3>
        <p className="text-[10px] sm:text-[11px] text-outline-variant truncate">
          {[protocol.duration, formatFreq(protocol.frequency, protocol.repeatEvery)]
            .filter(Boolean)
            .join(" / ")}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Toggle Switch */}
        <button
          onClick={() => onToggle(protocol.id, !protocol.isActive)}
          className={clsx(
            "w-9 h-5 rounded-full p-0.5 transition-colors duration-200 relative",
            protocol.isActive
              ? "bg-secondary"
              : "bg-surface-container-highest border border-outline-variant/30",
          )}
        >
          <div
            className={clsx(
              "w-4 h-4 rounded-full transition-transform duration-200 bg-white",
              protocol.isActive ? "translate-x-4" : "translate-x-0 opacity-50",
            )}
          />
        </button>

        <button
          onClick={() => onDelete(protocol.id)}
          className="text-outline-variant hover:text-error transition-colors opacity-50 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </Reorder.Item>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProtocolPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskName, setTaskName] = useState("");
  const [taskDuration, setTaskDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState<"min" | "hr">("min");
  const [selectedIcon, setSelectedIcon] = useState<IconName>("Zap");

  const DAYS = ["M", "T", "W", "Th", "F", "Sa", "Su"];
  const [frequency, setFrequency] = useState<string[]>(DAYS);
  const [freqMode, setFreqMode] = useState<"days" | "interval">("days");
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [quote, setQuote] = useState("");
  const { fetchApi } = useApi();
  const [mounted, setMounted] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);

  const [undoProtocol, setUndoProtocol] = useState<{
    id: string;
    protocol: Protocol;
    timer: any;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    setQuote(getRandomQuote());
  }, []);

  // Fetch protocols on mount
  useEffect(() => {
    loadProtocols();
  }, []);

  const loadProtocols = useCallback(async () => {
    try {
      const res = await fetchApi("/protocols");
      if (res.ok) setProtocols(await res.json());
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  const toggleDay = (day: string) => {
    setFrequency((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleAddProtocol = async () => {
    if (!taskName.trim()) return;

    const sortedFreq =
      freqMode === "days" ? DAYS.filter((d) => frequency.includes(d)) : [];
    const finalRepeatEvery = freqMode === "interval" ? repeatEvery : null;
    const finalDuration = taskDuration.trim()
      ? `${taskDuration.trim()} ${durationUnit}`
      : "";

    const res = await fetchApi("/protocols", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: taskName.trim(),
        duration: finalDuration,
        frequency: sortedFreq,
        repeatEvery: finalRepeatEvery,
        icon: selectedIcon,
      }),
    });

    if (res.ok) {
      const created = await res.json();
      setProtocols((prev) => [...prev, created]);
      setTaskName("");
      setTaskDuration("");
      setDurationUnit("min");
      setSelectedIcon("Zap");
      setFrequency(DAYS);
      setFreqMode("days");
      setRepeatEvery(1);
    }
  };

  // Save reorder to DB immediately on drop
  const handleReorder = useCallback(async (newOrder: Protocol[]) => {
    setProtocols(newOrder);
    // Fire-and-forget update for each item whose order changed
    newOrder.forEach((p, i) => {
      if (p.sortOrder !== i) {
        fetchApi(`/protocols/${p.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: i }),
        });
      }
    });
  }, []);

  const handleDelete = async (id: string) => {
    const protocolToDelete = protocols.find((p) => p.id === id);
    if (!protocolToDelete) return;

    // If there's already an active undo, commit it immediately
    if (undoProtocol) {
      clearTimeout(undoProtocol.timer);
      await fetchApi(`/protocols/${undoProtocol.id}`, { method: "DELETE" });
    }

    // Optimistically remove from UI
    setProtocols((prev) => prev.filter((p) => p.id !== id));

    // Set up undo timer
    const timer = setTimeout(async () => {
      await fetchApi(`/protocols/${id}`, { method: "DELETE" });
      setUndoProtocol(null);
    }, 4000);

    setUndoProtocol({ id, protocol: protocolToDelete, timer });
  };

  const handleUndoDelete = () => {
    if (undoProtocol) {
      clearTimeout(undoProtocol.timer);
      setProtocols((prev) => {
        const restored = [...prev, undoProtocol.protocol];
        // Sort back to original order
        return restored.sort((a, b) => a.sortOrder - b.sortOrder);
      });
      setUndoProtocol(null);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    setProtocols((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive } : p)),
    );
    await fetchApi(`/protocols/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
  };

  return (
    <PageContainer>
      <div className="mb-12">
        <h1 className="text-headline-xl italic mb-4">Protocol</h1>
        <p className="text-body-base text-on-surface-variant max-w-md">
          Define your non-negotiables for high performance.
        </p>
      </div>

      <section className="mb-16">
        <h2 className="text-[10px] font-semibold text-outline  tracking-[0.15em] uppercase mb-4 px-2">
          New Protocol Entry
        </h2>

        <div id="protocol-form" className="bg-surface-container rounded-xl border border-outline-variant/10 p-6">
          <div className="mb-6">
            <label className="block text-[10px] font-semibold text-outline tracking-widest uppercase mb-3">
              Task Name
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddProtocol()}
              placeholder="e.g. Deep Focus"
              className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-4 py-3 text-primary placeholder:text-outline-variant/50 focus:outline-none focus:border-secondary/50 transition-colors"
            />
          </div>

          <div className="mb-6">
            <label className="block text-[10px] font-semibold text-outline tracking-widest uppercase mb-3">
              Duration
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={taskDuration}
                onChange={(e) =>
                  setTaskDuration(e.target.value.replace(/[^0-9.]/g, ""))
                }
                placeholder="e.g. 45"
                className="flex-1 min-w-0 bg-surface-container-highest border border-outline-variant/30 rounded-lg px-4 py-3 text-primary placeholder:text-outline-variant/30 focus:outline-none focus:border-secondary/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              {(["min", "hr"] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setDurationUnit(unit)}
                  className={clsx(
                    "w-12 sm:w-16 shrink-0 flex items-center justify-center rounded-lg text-xs font-semibold transition-all border",
                    durationUnit === unit
                      ? "bg-secondary/10 border-secondary text-secondary"
                      : "bg-surface-container-highest border-outline-variant/30 text-outline-variant hover:border-outline-variant hover:text-outline",
                  )}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-[10px] font-semibold text-outline tracking-widest uppercase mb-3">
              Icon
            </label>
            <div className="flex gap-2">
              {(Object.keys(ICON_MAP) as IconName[]).map((iconName) => {
                const Icon = ICON_MAP[iconName];
                return (
                  <button
                    key={iconName}
                    onClick={() => setSelectedIcon(iconName)}
                    className={clsx(
                      "flex-1 h-11 flex items-center justify-center rounded-lg border transition-all",
                      selectedIcon === iconName
                        ? "bg-secondary/10 border-secondary text-secondary"
                        : "bg-surface-container-highest border-outline-variant/30 text-outline-variant hover:border-outline-variant hover:text-outline",
                    )}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            {/* Label row with inline mode toggle */}
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-semibold text-outline tracking-widest uppercase">
                Frequency
              </label>
              <div className="flex items-center p-[2px] bg-surface-container-highest rounded-full border border-outline-variant/15">
                {(["days", "interval"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFreqMode(mode)}
                    className={clsx(
                      "px-3 py-[4px] rounded-full text-[9px] font-bold tracking-wider uppercase transition-all duration-150 relative z-10",
                      freqMode === mode
                        ? "text-white"
                        : "text-outline-variant hover:text-outline",
                    )}
                  >
                    {freqMode === mode && (
                      <motion.div
                        layoutId="activeFreqMode"
                        className="absolute inset-0 bg-secondary rounded-full -z-10 shadow-sm"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    {mode === "days" ? "Days" : "Every"}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-11 relative overflow-hidden">
              <AnimatePresence initial={false}>
                {freqMode === "days" ? (
                  <motion.div
                    key="days"
                    initial={{ x: "-100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "-100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="flex items-center gap-1.5 h-full absolute inset-0"
                  >
                    {DAYS.map((day) => {
                      const isActive = frequency.includes(day);
                      return (
                        <button
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={clsx(
                            "flex-1 h-full rounded-lg text-[10px] font-bold transition-all border",
                            isActive
                              ? "bg-secondary/15 border-secondary text-secondary"
                              : "bg-surface-container-highest border-outline-variant/20 text-outline-variant hover:border-outline-variant/40 hover:text-outline"
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    key="interval"
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="flex items-center gap-4 bg-surface-container-highest/50 border border-outline-variant/20 rounded-full px-1 h-full absolute inset-0"
                  >
                    <button
                      onClick={() => setRepeatEvery((v) => Math.max(1, v - 1))}
                      className="w-9 h-9 rounded-full bg-surface-container border border-outline-variant/20 text-outline-variant hover:text-primary hover:border-secondary/50 transition-all flex items-center justify-center active:scale-95 shrink-0"
                    >
                      <Minus size={16} />
                    </button>
                    
                    <div className="flex-1 flex flex-row items-center justify-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={repeatEvery}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          if (val) setRepeatEvery(Math.min(365, parseInt(val)));
                          else setRepeatEvery(0);
                        }}
                        onBlur={() => {
                          if (repeatEvery < 1) setRepeatEvery(1);
                        }}
                        className="w-10 bg-transparent text-center text-xl font-bold text-primary focus:outline-none tabular-nums"
                      />
                      <span className="text-[10px] font-bold text-outline-variant uppercase tracking-widest pt-1 pointer-events-none">
                        {repeatEvery === 1 ? "Day" : "Days"}
                      </span>
                    </div>

                    <button
                      onClick={() => setRepeatEvery((v) => Math.min(365, v + 1))}
                      className="w-9 h-9 rounded-full bg-surface-container border border-outline-variant/20 text-outline-variant hover:text-primary hover:border-secondary/50 transition-all flex items-center justify-center active:scale-95 shrink-0"
                    >
                      <Plus size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            onClick={handleAddProtocol}
            disabled={!mounted || !taskName.trim()}
            suppressHydrationWarning
            className="w-full py-4 border border-outline-variant/30 hover:border-secondary/50 rounded-lg text-xs font-semibold tracking-[0.2em] uppercase text-outline hover:text-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Commit To Protocol
          </button>
        </div>
      </section>

      <section id="protocol-list" className="mb-24">
        <div className="flex justify-between items-end mb-6 px-2">
          <h2 className="text-[10px] font-semibold text-outline tracking-[0.15em] uppercase">
            Active Protocols
          </h2>
          <span className="text-[10px] text-outline-variant font-medium tracking-wide uppercase">
            {loading ? "—" : `${protocols.length} Protocols`}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="w-full h-[76px] rounded-xl bg-surface-container animate-pulse"
              />
            ))}
          </div>
        ) : protocols.length === 0 ? (
          <div className="text-center py-12 text-outline-variant text-sm">
            No protocols yet. Add your first above.
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={protocols}
            onReorder={handleReorder}
            className="flex flex-col gap-4"
          >
            {protocols.map((protocol) => (
              <ProtocolItem
                key={protocol.id}
                protocol={protocol}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onEdit={() => setEditingProtocol(protocol)}
              />
            ))}
          </Reorder.Group>
        )}
      </section>

      <div className="text-center px-8 pb-32">
        <p className="text-on-surface-variant text-body-base max-w-md mx-auto">
          &ldquo;{quote}&rdquo;
        </p>
      </div>

      {/* ── Undo Deletion Toast ── */}
      <AnimatePresence>
        {undoProtocol && (
          <motion.div
            key="undo-delete-toast"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            onClick={handleUndoDelete}
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
                Protocol deleted...
              </span>

              <span className="text-xs font-bold tracking-[0.25em] uppercase text-secondary shrink-0">
                Undo
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <EditProtocolModal
        protocol={editingProtocol}
        isOpen={!!editingProtocol}
        onClose={() => setEditingProtocol(null)}
        onProtocolUpdated={loadProtocols}
      />
    </PageContainer>
  );
}
