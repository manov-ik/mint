"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Zap, AlignLeft, Utensils, Dumbbell, BookOpen, Droplet, Minus, Plus } from "lucide-react";
import { useApi } from "@/lib/api-client";
import clsx from "clsx";

const ICON_MAP = {
  Zap,
  AlignLeft,
  Utensils,
  Dumbbell,
  BookOpen,
  Droplet,
};

type IconName = keyof typeof ICON_MAP;
const DAYS = ["M", "T", "W", "Th", "F", "Sa", "Su"];

interface EditProtocolModalProps {
  protocol: {
    id: string;
    title: string;
    duration: string;
    icon: string;
    frequency: string[];
    repeatEvery?: number | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onProtocolUpdated: () => void;
}

export function EditProtocolModal({
  protocol,
  isOpen,
  onClose,
  onProtocolUpdated,
}: EditProtocolModalProps) {
  const [title, setTitle] = useState("");
  const [taskDuration, setTaskDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState<"min" | "hr">("min");
  const [selectedIcon, setSelectedIcon] = useState<IconName>("Zap");
  const [frequency, setFrequency] = useState<string[]>(DAYS);
  const [freqMode, setFreqMode] = useState<"days" | "interval">("days");
  const [repeatEvery, setRepeatEvery] = useState(1);
  
  const { fetchApi } = useApi();
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form state when a protocol is passed in
  useEffect(() => {
    if (protocol) {
      setTitle(protocol.title);
      
      // Parse duration "45 min" or "2 hr"
      if (protocol.duration) {
        const parts = protocol.duration.split(" ");
        if (parts.length >= 2) {
          setTaskDuration(parts[0]);
          setDurationUnit(parts[1] as "min" | "hr");
        } else {
          setTaskDuration(protocol.duration);
          setDurationUnit("min");
        }
      } else {
        setTaskDuration("");
        setDurationUnit("min");
      }
      
      setSelectedIcon((protocol.icon as IconName) || "Zap");
      
      if (protocol.repeatEvery && protocol.repeatEvery > 0) {
        setFreqMode("interval");
        setRepeatEvery(protocol.repeatEvery);
        setFrequency([]);
      } else {
        setFreqMode("days");
        setFrequency(protocol.frequency || DAYS);
        setRepeatEvery(1);
      }
    }
  }, [protocol]);

  // Handle the Escape key to close the modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const toggleDay = (day: string) => {
    setFrequency((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  async function handleSave() {
    if (!protocol || !title.trim()) return;
    setIsSaving(true);
    
    const sortedFreq = freqMode === "days" ? DAYS.filter((d) => frequency.includes(d)) : [];
    const finalRepeatEvery = freqMode === "interval" ? repeatEvery : null;
    const finalDuration = taskDuration.trim()
      ? `${taskDuration.trim()} ${durationUnit}`
      : "";

    try {
      const res = await fetchApi(`/protocols/${protocol.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          duration: finalDuration,
          icon: selectedIcon,
          frequency: sortedFreq,
          repeatEvery: finalRepeatEvery,
        }),
      });
      if (res.ok) {
        onProtocolUpdated();
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            role="dialog"
            className="relative w-full max-w-[400px] bg-surface-container-high border border-outline-variant/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-6"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold tracking-widest text-primary uppercase">
                Edit Protocol
              </h2>
              <button
                onClick={onClose}
                className="text-outline hover:text-primary transition-colors p-1"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-5 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest text-outline uppercase ml-1">
                  Protocol Name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Deep Focus"
                  className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-primary placeholder:text-outline/50 focus:outline-none focus:border-secondary/50 transition-colors"
                />
              </div>

              {/* Duration */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest text-outline uppercase ml-1">
                  Duration
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={taskDuration}
                    onChange={(e) => setTaskDuration(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="e.g. 45"
                    className="flex-1 min-w-0 bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-primary placeholder:text-outline/30 focus:outline-none focus:border-secondary/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  {(["min", "hr"] as const).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setDurationUnit(unit)}
                      className={clsx(
                        "w-14 shrink-0 flex items-center justify-center rounded-xl text-xs font-semibold transition-all border",
                        durationUnit === unit
                          ? "bg-secondary/10 border-secondary text-secondary"
                          : "bg-surface-container-highest border-outline-variant/30 text-outline-variant hover:border-outline-variant hover:text-outline"
                      )}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest text-outline uppercase ml-1">
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
                          "flex-1 h-11 flex items-center justify-center rounded-xl border transition-all",
                          selectedIcon === iconName
                            ? "bg-secondary/10 border-secondary text-secondary"
                            : "bg-surface-container-highest border-outline-variant/30 text-outline-variant hover:border-outline-variant hover:text-outline"
                        )}
                      >
                        <Icon size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Frequency */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold tracking-widest text-outline uppercase ml-1">
                    Frequency
                  </label>
                  <div className="flex items-center p-[2px] bg-surface-container-highest rounded-full border border-outline-variant/15">
                    {(["days", "interval"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setFreqMode(mode)}
                        className={clsx(
                          "px-3 py-[4px] rounded-full text-[9px] font-bold tracking-wider uppercase transition-all duration-150 relative z-10",
                          freqMode === mode ? "text-white" : "text-outline-variant hover:text-outline"
                        )}
                      >
                        {freqMode === mode && (
                          <motion.div
                            layoutId="editFreqMode"
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
                  <AnimatePresence initial={false} mode="wait">
                    {freqMode === "days" ? (
                      <motion.div
                        key="days"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="flex items-center gap-1.5 h-full"
                      >
                        {DAYS.map((day) => {
                          const isActive = frequency.includes(day);
                          return (
                            <button
                              key={day}
                              onClick={() => toggleDay(day)}
                              className={clsx(
                                "flex-1 h-full rounded-xl text-[10px] font-bold transition-all border",
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
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 20, opacity: 0 }}
                        className="flex items-center gap-4 bg-surface-container-highest/50 border border-outline-variant/20 rounded-full px-1 h-full"
                      >
                        <button
                          onClick={() => setRepeatEvery((v) => Math.max(1, v - 1))}
                          className="w-9 h-9 rounded-full bg-surface-container border border-outline-variant/20 text-outline-variant hover:text-primary transition-all flex items-center justify-center"
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
                            onBlur={() => { if (repeatEvery < 1) setRepeatEvery(1); }}
                            className="w-10 bg-transparent text-center text-xl font-bold text-primary focus:outline-none tabular-nums"
                          />
                          <span className="text-[10px] font-bold text-outline-variant uppercase tracking-widest pt-1">
                            {repeatEvery === 1 ? "Day" : "Days"}
                          </span>
                        </div>
                        <button
                          onClick={() => setRepeatEvery((v) => Math.min(365, v + 1))}
                          className="w-9 h-9 rounded-full bg-surface-container border border-outline-variant/20 text-outline-variant hover:text-primary transition-all flex items-center justify-center"
                        >
                          <Plus size={16} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="mt-2 w-full py-4 bg-secondary text-on-secondary rounded-xl text-xs font-bold tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <span className="animate-pulse">Saving...</span>
              ) : (
                <>
                  <Check size={16} strokeWidth={3} />
                  Save Changes
                </>
              )}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
