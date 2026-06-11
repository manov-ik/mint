"use client";

import { useApi } from "@/lib/api-client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, X, Trash2, Calendar } from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import useMeasure from "react-use-measure";
import { useLongPress } from "@/lib/use-long-press";
import { EditTaskModal } from "./EditTaskModal";

const SPRING = { type: "spring", stiffness: 360, damping: 30 } as const;

// ============================================================================
// Helper Functions
// ============================================================================

function toLocalDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getTomorrowStr() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toLocalDateStr(tomorrow);
}

function formatShortDate(dateStr: string) {
  if (!dateStr) return "";
  const simpleDate = dateStr.split("T")[0];
  const [y, m, d] = simpleDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

// ============================================================================
// Sub-Component: Floating Task Item
// ============================================================================

function FloatingTaskItem({
  task,
  selectedDay,
  onEdit,
  onRemove,
}: {
  task: { id: string; title: string; date?: string };
  selectedDay: string;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const longPressProps = useLongPress(onEdit);

  return (
    <div
      {...longPressProps}
      className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-container-highest/60 group cursor-default"
    >
      <div className="flex flex-col min-w-0 flex-1 mr-2">
        <span className="text-sm text-primary truncate">{task.title}</span>
        {selectedDay === "later" && task.date && (
          <span className="text-[10px] text-secondary font-bold tracking-wider mt-0.5">
            {formatShortDate(task.date)}
          </span>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-outline-variant opacity-60 md:opacity-40 group-hover:opacity-100 hover:text-error transition-all shrink-0"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ============================================================================
// Main Component: FloatingTaskAdd
// ============================================================================

export function FloatingTaskAdd({ onTaskAdded }: { onTaskAdded?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const [contentRef, { height: contentHeight }] = useMeasure();

  const [tasksForDay, setTasksForDay] = useState<
    { id: string; title: string; date?: string }[]
  >([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const { fetchApi } = useApi();
  const [editingTask, setEditingTask] = useState<any>(null);

  const [selectedDay, setSelectedDay] = useState<
    "today" | "tomorrow" | "later"
  >("today");
  const [customDateStr, setCustomDateStr] = useState("");

  const [fetched, setFetched] = useState(false);
  const [autoTomorrowHour, setAutoTomorrowHour] = useState(18);

  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const PADDING = 24;
  const targetHeight = isOpen ? contentHeight + PADDING * 2 : 56;
  const isMobile = windowWidth < 640;
  const targetWidth = isOpen 
    ? Math.min(360, windowWidth - (isMobile ? 48 : 64)) 
    : 56;

  // 1. Initial Settings Load
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetchApi("/settings", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const hour = data.autoTomorrowHour ?? 18;
          setAutoTomorrowHour(hour);

          const now = new Date();
          if (now.getHours() >= hour) setSelectedDay("tomorrow");
          else setSelectedDay("today");
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Click Outside to Close
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        // Don't close if they clicked inside a dialog (like the native calendar picker or EditTaskModal)
        if (
          !target.closest('[role="dialog"]') &&
          !target.closest(".flatpickr-calendar")
        ) {
          setIsOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // 3. Bulletproof Fetching Logic
  const fetchTasks = useCallback(
    async (clearFirst = false) => {
      if (!isOpen) return;
      if (clearFirst) {
        setTasksForDay([]);
        setFetched(false);
      }

      try {
        const isUpcoming = selectedDay === "later" && !customDateStr;
        let url = "";

        if (isUpcoming) {
          // Hits the new dedicated upcoming endpoint
          url = `/tasks/upcoming`;
        } else {
          // Calculate explicit date
          let dateToFetch = "";
          if (selectedDay === "today") dateToFetch = toLocalDateStr(new Date());
          else if (selectedDay === "tomorrow") dateToFetch = getTomorrowStr();
          else dateToFetch = customDateStr;

          url = `/tasks?date=${dateToFetch}`;
        }

        const res = await fetchApi(url, { cache: "no-store" });
        if (res.ok) {
          const data: any[] = await res.json();

          // Ensure protocols are hidden and map data
          let filteredTasks = data
            .filter((t) => !t.protocolId)
            .map((t) => ({ id: t.id, title: t.title, date: t.date }));

          // Sort the "Later" tab explicitly by date
          if (isUpcoming) {
            filteredTasks = filteredTasks.sort((a, b) =>
              (a.date || "").localeCompare(b.date || ""),
            );
          }

          setTasksForDay(filteredTasks);
        }
      } finally {
        setFetched(true);
      }
    },
    [isOpen, selectedDay, customDateStr, fetchApi],
  );

  // Trigger fetch exactly when tabs or dates change (breaks infinite loops!)
  useEffect(() => {
    if (isOpen) fetchTasks(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedDay, customDateStr]);

  // 4. Bulletproof Add Logic
  async function addTask() {
    if (!newTaskTitle.trim()) return;

    const isUpcoming = selectedDay === "later" && !customDateStr;
    if (isUpcoming) return; // Prevent adding tasks into the void

    // Calculate exact date to save
    let dateToAssign = "";
    if (selectedDay === "today") dateToAssign = toLocalDateStr(new Date());
    else if (selectedDay === "tomorrow") dateToAssign = getTomorrowStr();
    else dateToAssign = customDateStr;

    const title = newTaskTitle.trim();
    const tempId = `temp-${Date.now()}`;

    setTasksForDay((prev) => {
      const newTasks = [...prev, { id: tempId, title, date: dateToAssign }];
      if (selectedDay === "later") {
        return newTasks.sort((a, b) =>
          (a.date || "").localeCompare(b.date || ""),
        );
      }
      return newTasks;
    });
    setNewTaskTitle("");

    const res = await fetchApi("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date: dateToAssign }),
    });

    if (res.ok) {
      const created = await res.json();
      setTasksForDay((prev) => {
        const updated = prev.map((t) =>
          t.id === tempId
            ? { id: created.id, title: created.title, date: created.date }
            : t,
        );
        if (selectedDay === "later") {
          return updated.sort((a, b) =>
            (a.date || "").localeCompare(b.date || ""),
          );
        }
        return updated;
      });
      onTaskAdded?.();
    } else {
      setTasksForDay((prev) => prev.filter((t) => t.id !== tempId));
    }
  }

  async function removeTask(id: string) {
    setTasksForDay((prev) => prev.filter((t) => t.id !== id));
    if (!id.startsWith("temp-")) {
      await fetchApi(`/tasks/${id}`, { method: "DELETE" });
    }
  }

  const isLaterMissingDate = selectedDay === "later" && !customDateStr;

  return (
    <div ref={navRef} id="task-pill" className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[60]">
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
        <AnimatePresence initial={false}>
          {!isOpen && (
            <motion.div
              key="icon"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex items-center justify-center text-primary"
            >
              <Plus size={24} />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={clsx(
            "absolute inset-0 p-6 flex flex-col",
            !isOpen && "pointer-events-none",
          )}
        >
          <motion.div
            ref={contentRef}
            animate={{ opacity: isOpen ? 1 : 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* Header / Tabs */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                  Tasks
                </span>
                <div className="flex bg-surface-container-highest rounded-full p-0.5 border border-outline-variant/20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDay("today");
                      setCustomDateStr("");
                    }}
                    className={clsx(
                      "px-3 py-0.5 rounded-full text-[10px] font-bold transition-all",
                      selectedDay === "today"
                        ? "bg-secondary text-on-secondary shadow-sm"
                        : "text-outline hover:text-primary",
                    )}
                  >
                    TODAY
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDay("tomorrow");
                      setCustomDateStr("");
                    }}
                    className={clsx(
                      "px-3 py-0.5 rounded-full text-[10px] font-bold transition-all",
                      selectedDay === "tomorrow"
                        ? "bg-secondary text-on-secondary shadow-sm"
                        : "text-outline hover:text-primary",
                    )}
                  >
                    TOMORROW
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDay("later");
                      setCustomDateStr("");
                    }}
                    className={clsx(
                      "px-3 py-0.5 rounded-full text-[10px] font-bold transition-all",
                      selectedDay === "later"
                        ? "bg-secondary text-on-secondary shadow-sm"
                        : "text-outline hover:text-primary",
                    )}
                  >
                    LATER
                  </button>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-outline-variant hover:text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Input Row */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLaterMissingDate) addTask();
                }}
                placeholder={
                  isLaterMissingDate ? "Pick a date first..." : "Task name..."
                }
                disabled={isLaterMissingDate}
                className="flex-1 min-w-0 bg-surface-container-highest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-primary placeholder:text-outline-variant/40 focus:outline-none focus:border-secondary/50 transition-colors disabled:opacity-50"
              />

              {selectedDay === "later" && (
                <div className="relative group/cal shrink-0">
                  <div className="relative flex items-center justify-center min-w-[52px] h-[38px] bg-surface-container-highest border border-outline-variant/30 rounded-xl hover:border-secondary/50 transition-all group overflow-hidden">
                    <input
                      type="date"
                      className="absolute inset-0 opacity-0 cursor-pointer w-[200%] h-[200%] -left-[50%] -top-[50%] z-20 block appearance-none"
                      value={customDateStr}
                      onClick={(e) => {
                        if ("showPicker" in HTMLInputElement.prototype) {
                          try {
                            (e.target as HTMLInputElement).showPicker();
                          } catch (err) {}
                        }
                      }}
                      onChange={(e) => setCustomDateStr(e.target.value)}
                    />
                    <div className="flex items-center justify-center text-secondary pointer-events-none z-10 w-full h-full gap-1.5 px-2">
                      {customDateStr ? (
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[7px] font-bold leading-tight uppercase opacity-60">
                            {formatShortDate(customDateStr).split(" ")[0]}
                          </span>
                          <span className="text-[13px] font-black leading-none tracking-tight">
                            {formatShortDate(customDateStr).split(" ")[1]}
                          </span>
                        </div>
                      ) : (
                        <Calendar
                          size={16}
                          className="text-outline-variant group-hover/cal:text-primary transition-colors"
                        />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {customDateStr && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomDateStr(""); // Instantly fetch ALL upcoming again
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-surface-container-highest border border-outline-variant/50 rounded-full flex items-center justify-center text-outline hover:text-primary shadow-lg z-30 transition-colors"
                      >
                        <X size={10} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <button
                onClick={addTask}
                disabled={!newTaskTitle.trim() || isLaterMissingDate}
                className="px-3 bg-secondary/10 text-secondary border border-secondary/20 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-secondary/20 transition-colors disabled:opacity-40 shrink-0"
              >
                Add
              </button>
            </div>

            {/* List */}
            <div className="flex flex-col gap-1.5 max-h-[28vh] overflow-y-auto">
              {tasksForDay.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-outline text-sm mb-1 italic">
                    {!fetched ? "Fetching..." : "No tasks found."}
                  </div>
                  <div className="text-outline-variant/60 text-[10px] uppercase tracking-widest">
                    {!fetched
                      ? "Checking server..."
                      : selectedDay === "later" && !customDateStr
                        ? "Plan your future."
                        : `Nothing queued.`}
                  </div>
                </div>
              ) : (
                tasksForDay.map((task) => (
                  <FloatingTaskItem
                    key={task.id}
                    task={task}
                    selectedDay={selectedDay}
                    onEdit={() =>
                      setEditingTask({
                        id: task.id,
                        title: task.title,
                        date: task.date,
                      })
                    }
                    onRemove={() => removeTask(task.id)}
                  />
                ))
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      <EditTaskModal
        isOpen={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onTaskUpdated={() => {
          fetchTasks(false);
          onTaskAdded?.();
        }}
      />
    </div>
  );
}
