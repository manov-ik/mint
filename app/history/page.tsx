"use client";

import { useApi } from "@/lib/api-client";

import { PageContainer } from "@/components/PageContainer";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from "lucide-react";
import clsx from "clsx";
import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Types & helpers                                                     */
/* ------------------------------------------------------------------ */

interface ChartPoint {
  name: string;
  value: number;
}

interface DayTask {
  title: string;
  description: string;
  completed: boolean;
}

function toLocalDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Read a CSS custom property from :root as a resolved color string */
function getCSSColor(variable: string): string {
  if (typeof window === "undefined") return "#a78bfa";
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  // If it's already a full color (hex, rgb, etc.) return it directly
  if (raw.startsWith("#") || raw.startsWith("rgb")) return raw;
  // Otherwise it's HSL channel values like "250 60% 70%" — wrap them
  return raw ? `hsl(${raw})` : "#a78bfa";
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ------------------------------------------------------------------ */
/* Day detail modal                                                    */
/* ------------------------------------------------------------------ */

function DayDetail({ date, onClose }: { date: Date; onClose: () => void }) {
  const [tasks, setTasks] = useState<DayTask[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { fetchApi } = useApi();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchApi(`/tasks?date=${toLocalDateStr(date)}`, {
          cache: "no-store",
        });
        setTasks(res.ok ? await res.json() : []);
      } catch {
        setTasks([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [date]);

  const completedCount = tasks?.filter((t) => t.completed).length ?? 0;
  const totalCount = tasks?.length ?? 0;
  const pct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 32, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="relative w-full max-w-sm bg-surface-container rounded-2xl border border-outline-variant/20 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/10">
          <div>
            <div className="text-2xl font-light text-secondary mb-0.5">
              {loading ? "—" : `${completedCount}/${totalCount}`}
            </div>
            <p className="text-[10px] font-semibold text-outline tracking-wider uppercase">
              {date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center text-outline hover:text-primary transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4 pb-3">
          <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.1,
              }}
              className="h-full bg-secondary rounded-full"
            />
          </div>
        </div>

        {/* Task list */}
        <div className="px-6 pb-6 flex flex-col gap-1.5 overflow-y-auto max-h-[45vh]">
          {loading ? (
            <div className="py-8 text-center text-outline-variant text-sm">
              Loading…
            </div>
          ) : !tasks || tasks.length === 0 ? (
            <div className="py-8 text-center text-outline-variant text-sm">
              No tasks recorded for this day.
            </div>
          ) : (
            tasks.map((task, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-surface-container-high/60"
              >
                <div className="min-w-0 mr-3">
                  <div
                    className={clsx(
                      "text-sm font-medium truncate",
                      task.completed
                        ? "text-outline line-through"
                        : "text-primary",
                    )}
                  >
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-[10px] font-semibold tracking-wider text-outline uppercase mt-0.5 truncate">
                      {task.description}
                    </div>
                  )}
                </div>
                <div
                  className={clsx(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                    task.completed
                      ? "bg-secondary border-secondary text-on-secondary"
                      : "border-outline-variant/40",
                  )}
                >
                  {task.completed && <Check size={10} strokeWidth={3} />}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Chart with resolved CSS colors                                      */
/* ------------------------------------------------------------------ */

function CompletionChart({ data }: { data: ChartPoint[] }) {
  const [mounted, setMounted] = useState(false);
  const [colors, setColors] = useState({
    secondary: "#a78bfa",
    outline: "#6b7280",
    surface: "#1f1f1f",
  });

  useEffect(() => {
    setMounted(true);
    setColors({
      secondary: getCSSColor("--color-secondary"),
      outline: getCSSColor("--color-outline"),
      surface: getCSSColor("--color-surface-container-high"),
    });
  }, []);

  // ← Don't render chart at all until client is mounted
  if (!mounted) {
    return <div className="h-72" />;
  }

  if (data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-outline-variant text-xs">
        No data yet
      </div>
    );
  }

  // Compute real min/max from data so dot aligns perfectly
  const values = data.map((d) => d.value);
  const minVal = Math.min(...data.map((d) => d.value));
  const maxVal = Math.max(...data.map((d) => d.value));

  return (
    <div className="h-72">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={0}
      >
        <AreaChart
          data={data}
          margin={{ top: 12, right: 8, left: 8, bottom: 0 }}
        >
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={colors.secondary}
                stopOpacity={0.3}
              />
              <stop offset="95%" stopColor={colors.secondary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            tick={{ fill: colors.outline, fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[
              minVal === maxVal ? 0 : minVal,
              maxVal === 0 ? 100 : maxVal,
            ]}
            tick={{ fill: colors.outline, fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
            width={28}
            tickCount={3}
          />
          <Tooltip
            contentStyle={{
              background: colors.surface,
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: "8px",
              color: "#fff",
              fontSize: "11px",
              padding: "8px 12px",
            }}
            formatter={(v) => [`${v ?? 0}%`, "Completion"]}
            labelFormatter={(label) => label}
            labelStyle={{
              color: colors.outline,
              marginBottom: 4,
              fontSize: 10,
            }}
            cursor={{
              stroke: colors.outline,
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={colors.secondary}
            strokeWidth={1.5}
            fill="url(#chartGrad)"
            dot={false}
            activeDot={{
              r: 4,
              fill: colors.secondary,
              stroke: colors.surface,
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Calendar                                                            */
/* ------------------------------------------------------------------ */

function Calendar({
  selectedDate,
  setSelectedDate,
  firstTaskDate,
  completionMap,
}: {
  selectedDate: Date | null;
  setSelectedDate: (d: Date | null) => void;
  firstTaskDate: Date;
  completionMap: Record<string, { value: number; total: number }>;
}) {
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState(() => new Date());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setToday(d);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[340px] rounded-xl bg-surface-container/20 animate-pulse" />
    );
  }

  const minYear = firstTaskDate.getFullYear();
  const minMonth = firstTaskDate.getMonth();

  const isMinMonth = viewYear === minYear && viewMonth === minMonth;
  const isMaxMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  function prevMonth() {
    if (isMinMonth) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (isMaxMonth) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  function cellStyle(pct: number) {
    if (pct === 0) return "";
    if (pct < 40) return "bg-secondary/15 border-secondary/20";
    if (pct < 70) return "bg-secondary/30 border-secondary/30";
    return "bg-secondary/55 border-secondary/50";
  }

  return (
    <div>
      {/* Nav row */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={prevMonth}
          disabled={isMinMonth}
          className={clsx(
            "w-9 h-9 rounded-full border flex items-center justify-center transition-all",
            !isMinMonth
              ? "border-outline-variant/30 text-outline hover:text-primary hover:border-outline-variant"
              : "border-outline-variant/10 text-outline-variant/20 cursor-not-allowed",
          )}
        >
          <ChevronLeft size={17} />
        </button>
        <span className="text-sm font-medium text-primary">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          disabled={isMaxMonth}
          className={clsx(
            "w-9 h-9 rounded-full border flex items-center justify-center transition-all",
            !isMaxMonth
              ? "border-outline-variant/30 text-outline hover:text-primary hover:border-outline-variant"
              : "border-outline-variant/10 text-outline-variant/20 cursor-not-allowed",
          )}
        >
          <ChevronRight size={17} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-[9px] font-semibold text-outline-variant/50 tracking-wider uppercase py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`e${i}`} />
        ))}
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
          const d = new Date(viewYear, viewMonth, day);
          d.setHours(0, 0, 0, 0);
          const isFuture = d > today;
          const isToday = isSameDay(d, today);
          const isSelected = selectedDate ? isSameDay(d, selectedDate) : false;
          const dateStr = toLocalDateStr(d);
          const entry = completionMap[dateStr];
          const pct = entry?.value ?? 0;
          const hasTasks = !!entry;

          return (
            <button
              key={day}
              disabled={isFuture}
              onClick={() => {
                if (!isFuture) setSelectedDate(isSelected ? null : d);
              }}
              className={clsx(
                "aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-150 border relative",
                isSelected &&
                  "bg-secondary border-secondary text-on-secondary ring-1 ring-secondary/30",
                isToday &&
                  !isSelected &&
                  "border-secondary/60 text-secondary ring-1 ring-secondary/20",
                !isSelected && !isToday && hasTasks && cellStyle(pct),
                !isSelected &&
                  !isToday &&
                  !hasTasks &&
                  !isFuture &&
                  "border-outline-variant/10 text-outline-variant hover:border-outline-variant/30 hover:text-outline",
                isFuture &&
                  "opacity-60 cursor-not-allowed border-outline/10 text-outline",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-secondary/20 border border-secondary/25" />
          <span className="text-[9px] text-outline-variant/70 font-medium uppercase tracking-wide">
            Partial
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-secondary/55 border border-secondary/50" />
          <span className="text-[9px] text-outline-variant/70 font-medium uppercase tracking-wide">
            Complete
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* History Page                                                        */
/* ------------------------------------------------------------------ */

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [firstTaskDate, setFirstTaskDate] = useState<Date>(new Date());
  const [completionMap, setCompletionMap] = useState<
    Record<string, { value: number; total: number }>
  >({});
  const { fetchApi } = useApi();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchApi("/tasks/stats?days=365");
        if (res.ok) {
          const json = await res.json();
          const statsArr: { date: string; name: string; value: number }[] =
            json.stats ?? json;

          const mapped = statsArr.map((s) => ({
            name: s.name ?? s.date?.slice(5) ?? "",
            date: s.date,
            value: s.value ?? 0,
            total: (s as any).total ?? 0,
          }));

          setChartData(
            mapped.slice(-30).map((s) => ({
              ...s,
              name: s.date?.slice(5) ?? s.name, // always use MM-DD format e.g. "04-21"
            })),
          );

          const map: Record<string, { value: number; total: number }> = {};
          for (const s of mapped) {
            if (s.total > 0) map[s.date] = { value: s.value, total: s.total };
          }
          setCompletionMap(map as any);

          if (json.firstTaskDate) {
            const [y, m, d] = json.firstTaskDate.split("-").map(Number);
            setFirstTaskDate(new Date(y, m - 1, d));
          }
        }
      } catch {
        /* no-op */
      }
    }
    load();
  }, []);

  const activeDays = Object.keys(completionMap).length;
  const avgCompletion = useMemo(() => {
    const vals = Object.values(completionMap);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((s, v) => s + v.value, 0) / vals.length);
  }, [completionMap]);

  return (
    <PageContainer>
      <div className="mb-12">
        <h1 className="text-headline-xl italic mb-3">History</h1>
        <p className="text-body-base text-on-surface-variant">
          Your consistency, recorded.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-10">
        {[
          { label: "Active Days", value: activeDays },
          { label: "Avg Completion", value: `${avgCompletion}%` },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-surface-container rounded-xl p-5 flex flex-col items-center justify-center border border-outline-variant/10"
          >
            <div className="text-3xl text-secondary font-light mb-1.5">
              {s.value}
            </div>
            <div className="text-[9px] font-semibold text-outline tracking-wider uppercase">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Chart — last 30 days */}
      <section className="mb-10">
        <h2 className="text-[10px] font-semibold text-outline tracking-[0.15em] uppercase mb-4 px-1">
          30-Day Completion
        </h2>
        <div className="bg-surface-container rounded-xl border border-outline-variant/10 p-5">
          <CompletionChart data={chartData} />
        </div>
      </section>

      {/* Calendar */}
      <section className="mb-4">
        <h2 className="text-[10px] font-semibold text-outline tracking-[0.15em] uppercase mb-4 px-1">
          Calendar
        </h2>
        <div className="bg-surface-container rounded-xl border border-outline-variant/10 p-5">
          <Calendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            firstTaskDate={firstTaskDate}
            completionMap={completionMap}
          />
        </div>
        <div className="flex items-center gap-2 mt-3 px-1">
          <CheckCircle2 size={12} className="text-secondary" />
          <span className="text-[10px] text-outline-variant font-medium">
            Tap any day to see task details
          </span>
        </div>
      </section>

      <div className="h-24" />

      <AnimatePresence>
        {selectedDate && (
          <DayDetail
            date={selectedDate}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
