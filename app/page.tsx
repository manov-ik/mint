"use client";

import { useState, useEffect, useCallback } from "react";
import { PageContainer } from "@/components/PageContainer";
import {
  Check,
  Zap,
  ListTodo,
  Trash2,
  AlignLeft,
  Utensils,
  Dumbbell,
  BookOpen,
  Droplet,
} from "lucide-react";
import clsx from "clsx";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { FloatingTaskAdd } from "@/components/FloatingTaskAdd";
import { getRandomQuote } from "@/lib/quotes";
import { useApi } from "@/lib/api-client";
import { useLongPress } from "@/lib/use-long-press";
import { EditTaskModal } from "@/components/EditTaskModal";

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  AlignLeft,
  Utensils,
  Dumbbell,
  BookOpen,
  Droplet,
};

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  date: string;
  assignedDate: string;
  createdAt: string;
  protocolId?: string | null;
  protocolSortOrder?: number | null;
  protocolIcon?: string | null;
}

function toLocalDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function TaskItem({
  task,
  todayStr,
  toggleTask,
  deleteTask,
  onEdit,
  rolloverThreshold,
}: {
  task: Task;
  todayStr: string;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  onEdit: () => void;
  rolloverThreshold: number;
}) {
  const IconComp = task.protocolId
    ? (task.protocolIcon && ICON_MAP[task.protocolIcon]) || Zap
    : ListTodo;

  const longPressProps = useLongPress(() => {
    if (!task.protocolId) onEdit();
  });

  // --- SAFE BADGE LOGIC (Split method) ---
  let rolloverBadge = null;
  const targetDate = task.assignedDate || task.date;

  if (
    !task.protocolId &&
    !task.completed &&
    targetDate &&
    targetDate < todayStr
  ) {
    try {
      const [y, m, d] = targetDate.split("-").map(Number);
      const assignedMidnight = new Date(y, m - 1, d);
      const today = new Date();
      const todayMidnight = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      const diffTime = todayMidnight.getTime() - assignedMidnight.getTime();
      const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (daysPassed >= (rolloverThreshold || 1)) {
        rolloverBadge = (
          <span className="text-[9px] bg-error/10 text-error px-2 py-[2px] rounded ml-2 font-bold tracking-[0.1em] shrink-0 border border-error/20 uppercase shadow-sm">
            {daysPassed}d Overdue
          </span>
        );
      }
    } catch (e) {}
  }

  return (
    <motion.button
      layout
      onClick={() => toggleTask(task.id)}
      {...longPressProps}
      className="w-full flex items-center justify-between p-5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-left group cursor-default"
    >
      <div className="flex items-center gap-5 min-w-0">
        <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center text-outline-variant group-hover:text-primary transition-colors shrink-0">
          <IconComp size={18} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center min-w-0">
            <h3
              className={clsx(
                "text-base font-medium leading-snug transition-colors truncate",
                task.completed ? "text-outline line-through" : "text-primary",
              )}
            >
              {task.title}
            </h3>
            {rolloverBadge}
          </div>
          {task.description && (
            <p className="text-[10px] font-semibold tracking-[0.12em] text-outline-variant uppercase mt-0.5 truncate">
              {task.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <div
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            deleteTask(task.id);
          }}
          className="opacity-40 group-hover:opacity-100 transition-opacity duration-150 text-outline-variant hover:text-error p-1 rounded-md cursor-pointer"
        >
          <Trash2 size={13} strokeWidth={1.8} />
        </div>
        <div
          className={clsx(
            "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
            task.completed
              ? "bg-secondary border-secondary text-on-secondary"
              : "border-outline-variant/50 group-hover:border-secondary/60",
          )}
        >
          <AnimatePresence initial={false}>
            {task.completed && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Check size={14} strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.button>
  );
}

export default function FocusPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [rolloverThreshold, setRolloverThreshold] = useState(1);
  const [quote, setQuote] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [todayStr, setTodayStr] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [undoTask, setUndoTask] = useState<{
    id: string;
    task: Task;
    timer: any;
  } | null>(null);
  const { scrollYProgress } = useScroll();
  const { fetchApi } = useApi();

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setShowProgress(v > 0.8);
  });

  useEffect(() => {
    const now = new Date();
    setQuote(getRandomQuote());
    setTodayStr(toLocalDateStr(now));
    setDateLabel(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    );
    loadTasks();
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      // --- API FIX: FETCH ALL TO INCLUDE OVERDUE ---
      const [tasksRes, settingsRes] = await Promise.all([
        fetchApi(`/tasks`, { cache: "no-store" }),
        fetchApi("/settings", { cache: "no-store" }),
      ]);
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (settingsRes.ok) {
        const set = await settingsRes.json();
        setShowCompleted(set.showCompleted ?? true);
        setRolloverThreshold(set.rolloverThreshold ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const nextVal = !task.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextVal } : t)),
    );
    await fetchApi(`/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: nextVal }),
    });
  };

  const deleteTask = async (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    if (!taskToDelete) return;

    // If there's already an active undo, commit it immediately
    if (undoTask) {
      clearTimeout(undoTask.timer);
      await fetchApi(`/tasks/${undoTask.id}`, { method: "DELETE" });
    }

    // Optimistically remove from UI
    setTasks((prev) => prev.filter((t) => t.id !== id));

    // Set up undo timer
    const timer = setTimeout(async () => {
      await fetchApi(`/tasks/${id}`, { method: "DELETE" });
      setUndoTask(null);
    }, 4000);

    setUndoTask({ id, task: taskToDelete, timer });
  };

  const handleUndoDelete = () => {
    if (undoTask) {
      clearTimeout(undoTask.timer);
      setTasks((prev) => [...prev, undoTask.task]);
      setUndoTask(null);
    }
  };

  // --- FINAL SORTING LOGIC ---
  const displayTasks = tasks
    .filter((t) => {
      const isTodayOrPast = (t.assignedDate || t.date) <= todayStr;
      const isVisible = showCompleted ? true : !t.completed;
      return isTodayOrPast && isVisible;
    })
    .sort((a, b) => {
      // ── Tier 1: Completed always sink to the bottom ──
      if (a.completed !== b.completed) return a.completed ? 1 : -1;

      // ── Tier 2 (within same completion state): Protocols before manual ──
      const aIsProtocol = !!a.protocolId;
      const bIsProtocol = !!b.protocolId;
      if (aIsProtocol !== bIsProtocol) return aIsProtocol ? -1 : 1;

      // ── Tier 3a: Both protocols → sort by protocol sort order ──
      if (aIsProtocol && bIsProtocol) {
        return (a.protocolSortOrder ?? 0) - (b.protocolSortOrder ?? 0);
      }

      // ── Tier 3b: Both manual → sort by task date (oldest first) ──
      const dateA = a.assignedDate || a.date;
      const dateB = b.assignedDate || b.date;
      return dateA.localeCompare(dateB);
    });

  const completedCount = displayTasks.filter((t) => t.completed).length;
  const progressPct =
    displayTasks.length > 0
      ? Math.round((completedCount / displayTasks.length) * 100)
      : 0;

  return (
    <PageContainer>
      <div className="flex flex-col items-center mb-16 text-center">
        <h1 className="text-headline-xl mb-3 italic">{dateLabel}</h1>
        <p className="text-on-surface-variant text-body-base">
          &ldquo;{quote}&rdquo;
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-label-caps text-outline tracking-[0.15em]">
          Daily Objectives
        </h2>
        {!loading && (
          <span className="text-[11px] font-semibold text-secondary tracking-wide">
            {displayTasks.filter((t) => t.completed).length}/
            {displayTasks.length}
          </span>
        )}
      </div>

      <div id="objective-list" className="flex flex-col gap-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-full h-[72px] rounded-xl bg-surface-container animate-pulse"
              />
            ))}
          </div>
        ) : (
          displayTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              todayStr={todayStr}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              onEdit={() => setEditingTask(task)}
              rolloverThreshold={rolloverThreshold}
            />
          ))
        )}
      </div>

      {/* ── Static progress card (mobile) ── */}
      {!loading && displayTasks.length > 0 && (
        <div className="md:hidden mt-10 w-full">
          <div className="bg-surface-container-high/95 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-outline tracking-[0.15em] uppercase">
                Progress
              </span>
              <span className="text-sm font-semibold text-secondary">
                {progressPct}%
              </span>
            </div>
            <div className="h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom padding ── */}
      <div className="h-48" />

      {/* ── Floating progress bar (scroll-triggered) ── */}
      <AnimatePresence>
        {showProgress && !loading && displayTasks.length > 0 && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="hidden md:block fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[var(--spacing-container)] px-6 z-50 pointer-events-none"
          >
            <div className="bg-surface-container-high/95 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-outline tracking-[0.15em] uppercase">
                  Progress
                </span>
                <span className="text-sm font-semibold text-secondary">
                  {progressPct}%
                </span>
              </div>
              <div className="h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-secondary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingTaskAdd onTaskAdded={loadTasks} />
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={true}
          onClose={() => setEditingTask(null)}
          onTaskUpdated={loadTasks}
        />
      )}

      {/* ── Undo Deletion Toast ── */}
      <AnimatePresence>
        {undoTask && (
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
                Task deleted...
              </span>

              <span className="text-xs font-bold tracking-[0.25em] uppercase text-secondary shrink-0">
                Undo
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
