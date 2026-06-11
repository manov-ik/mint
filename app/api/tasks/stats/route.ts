import { getUserId } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and, gte, lte, asc, or, sql, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** YYYY-MM-DD in local time */
function toLocalDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ------------------------------------------------------------------ */
/* GET /api/tasks/stats?days=30                                        */
/* Returns per-day completion % + firstTaskDate for history anchoring */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const daysParam = request.nextUrl.searchParams.get("days");
  const days = Math.min(parseInt(daysParam ?? "30", 10), 365);

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days + 1);

  // Find the user's very first task (to anchor the calendar)
  const [firstTask] = await db
    .select({ date: tasks.date })
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(asc(tasks.date))
    .limit(1);

  const startDateStr = toLocalDateStr(startDate);
  const todayStr = toLocalDateStr(today);

  const allTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        or(
          // Protocol tasks bounded strictly
          and(
            sql`${tasks.protocolId} IS NOT NULL`,
            gte(sql`${tasks.date}::text`, startDateStr),
            lte(sql`${tasks.date}::text`, todayStr)
          ),
          // Manual tasks bounded by date and completedAt
          and(
            isNull(tasks.protocolId),
            lte(sql`${tasks.date}::text`, todayStr),
            or(
              eq(tasks.completed, false),
              gte(sql`${tasks.completedAt}::date::text`, startDateStr)
            )
          )
        )
      )
    );

  // Initialize grouping
  const byDate: Record<string, { total: number; completed: number }> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    byDate[toLocalDateStr(d)] = { total: 0, completed: 0 };
  }

  for (const task of allTasks) {
    const isProtocol = task.protocolId !== null;

    for (const [dateStr, entry] of Object.entries(byDate)) {
      if (isProtocol) {
        if (task.date === dateStr) {
          entry.total++;
          if (task.completed) entry.completed++;
        }
      } else {
        // Manual task
        if (task.date <= dateStr) {
          let wasCompletedOnOrBeforeDate = false;
          let wasCompletedExactlyOnDate = false;

          if (task.completed && task.completedAt) {
            const compDateStr = toLocalDateStr(task.completedAt);
            if (compDateStr <= dateStr) wasCompletedOnOrBeforeDate = true;
            if (compDateStr === dateStr) wasCompletedExactlyOnDate = true;
          }

          if (!wasCompletedOnOrBeforeDate || wasCompletedExactlyOnDate) {
            entry.total++;
            if (wasCompletedExactlyOnDate) entry.completed++;
          }
        }
      }
    }
  }

  // Build ordered array
  const result = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = toLocalDateStr(d);
    const entry = byDate[dateStr];
    result.push({
      date: dateStr,
      name: d.toLocaleDateString("en-US", { weekday: "short" }),
      value: entry ? Math.round((entry.completed / entry.total) * 100) : 0,
      total: entry?.total ?? 0,
      completed: entry?.completed ?? 0,
    });
  }

  return Response.json({
    stats: result,
    firstTaskDate: firstTask?.date ?? toLocalDateStr(today),
  });
}
