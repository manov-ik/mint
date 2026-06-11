import { getUserId } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { tasks, protocols, userSettings } from "@/lib/db/schema";
import { eq, and, sql, isNull, or, lte, gte } from "drizzle-orm";
import { NextRequest } from "next/server";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** YYYY-MM-DD in local time (avoids UTC offset issues e.g. IST) */
function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DOW_MAP: Record<number, string> = {
  0: "Su",
  1: "M",
  2: "T",
  3: "W",
  4: "Th",
  5: "F",
  6: "Sa",
};

const ORDERED_DAYS = ["M", "T", "W", "Th", "F", "Sa", "Su"];

function formatFreq(freq: unknown, repeatEvery?: number | null): string {
  if (repeatEvery && repeatEvery > 0) return `Every ${repeatEvery}d`;
  const f = Array.isArray(freq)
    ? freq
    : typeof freq === "string"
    ? JSON.parse(freq)
    : [];
  if (!f || f.length === 0) return "";
  if (f.length === 7) return "Daily";
  if (f.length === 5 && ORDERED_DAYS.slice(0, 5).every((d) => f.includes(d)))
    return "Weekdays";
  return ORDERED_DAYS.filter((d) => f.includes(d)).join(" · ");
}

/* ------------------------------------------------------------------ */
/* GET /api/tasks?date=YYYY-MM-DD                                      */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const dateParam = request.nextUrl.searchParams.get("date");
    const today = new Date();
    const targetDateStr = dateParam ?? toDateStr(today);
    const todayStr = toDateStr(today);

    // --- SEEDING / INITIALIZATION ---
    // Perform this at the very beginning to ensure data is ready for the subsequent query
    const [newSettings] = await db
      .insert(userSettings)
      .values({ userId })
      .onConflictDoNothing()
      .returning();

    if (newSettings) {
      try {
        await db.insert(protocols).values({
          userId,
          title: "Morning Momentum",
          duration: "15 min",
          icon: "Zap",
          frequency: ["M", "T", "W", "Th", "F", "Sa", "Su"],
        });

        await db.insert(tasks).values([
          {
            userId,
            title: "Long press or right click me to edit",
            date: todayStr,
          },
          {
            userId,
            title: "Go to Protocols to define your habits",
            date: todayStr,
          },
          {
            userId,
            title: "Click + to add tasks for tomorrow or later",
            date: todayStr,
          },
          {
            userId,
            title: "Delete these once you're ready to go!",
            date: todayStr,
          },
          {
            userId,
            title: "Check tomorrow's plan",
            date: toDateStr(new Date(today.getTime() + 86400000)),
          },
          {
            userId,
            title: "Example future task",
            date: toDateStr(new Date(today.getTime() + 86400000 * 7)),
          }
        ]);
      } catch (e) {
        console.error("Seeding in tasks/GET failed:", e);
      }
    }

    // Fetch user settings to check rollover preference
    const [setting] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    const moveUncompleted = setting?.moveUncompleted ?? true;

    const existingRaw = await db
      .select({
        id: tasks.id,
        userId: tasks.userId,
        title: tasks.title,
        description: tasks.description,
        date: tasks.date,
        createdAt: tasks.createdAt,
        completed: tasks.completed,
        completedAt: tasks.completedAt,
        protocolId: tasks.protocolId,
        protocolSortOrder: protocols.sortOrder,
        protocolIcon: protocols.icon,
        protocolDuration: protocols.duration,
        protocolFrequency: protocols.frequency,
        protocolRepeatEvery: protocols.repeatEvery,
        protocolCreatedAt: protocols.createdAt,
      })
      .from(tasks)
      .leftJoin(protocols, eq(tasks.protocolId, protocols.id))
      .where(
        and(
          eq(tasks.userId, userId),
          or(
            // Protocol tasks are strict to their actual generated date
            and(
              sql`${tasks.protocolId} IS NOT NULL`,
              sql`${tasks.date}::text = ${targetDateStr}`
            ),
              // Manual tasks: if moveUncompleted is true, use lazy evaluation
            moveUncompleted && targetDateStr <= todayStr
              ? and(
                  isNull(tasks.protocolId),
                  lte(sql`${tasks.date}::text`, targetDateStr),
                  or(
                    eq(tasks.completed, false),
                    gte(sql`${tasks.completedAt}::date::text`, targetDateStr),
                  ),
                )
              : and(
                  isNull(tasks.protocolId),
                  sql`${tasks.date}::text = ${targetDateStr}`,
                ),
          )
        )
      );

    // Dynamic State Evaluation: 
    // If a manual task is completed in the future relative to targetDateStr, it should appear uncompleted.
    const existing = existingRaw.map(t => {
      let isActuallyCompleted = t.completed;
      if (t.completed && t.completedAt) {
        const completedDateStr = toDateStr(t.completedAt);
        if (completedDateStr > targetDateStr) {
          isActuallyCompleted = false;
        }
      }
      
      let finalDescription = t.description;
      if (t.protocolId) {
        finalDescription = [t.protocolDuration, formatFreq(t.protocolFrequency, t.protocolRepeatEvery)]
          .filter(Boolean)
          .join(" / ");
      }

      return {
        id: t.id,
        userId: t.userId,
        title: t.title,
        description: finalDescription,
        date: targetDateStr, // Present it as belonging to the queried date
        assignedDate: t.date, // The real date
        createdAt: t.createdAt,
        completed: isActuallyCompleted,
        protocolId: t.protocolId,
        protocolSortOrder: t.protocolSortOrder,
        protocolIcon: t.protocolIcon,
      };
    });

    console.log(`[tasks GET] date=${targetDateStr} today=${todayStr} existing=${existing.length}`);

    // If we're looking at today, ensure ALL eligible protocols have tasks generated.
    // This handles the case where a user adds a new protocol in the middle of the day.
    if (targetDateStr === todayStr) {
      const existingProtocolIds = new Set(
        existing.map((t) => t.protocolId).filter((id) => id !== null)
      );

      const todayDow = DOW_MAP[today.getDay()];
      const userProtocols = await db
        .select()
        .from(protocols)
        .where(
          and(
            eq(protocols.userId, userId),
            eq(protocols.isActive, true)
          )
        );

      const todaysProtocols = userProtocols.filter((p) => {
        if (p.repeatEvery && p.repeatEvery > 0) {
          // Calculate days since creation
          const start = new Date(p.createdAt ?? new Date());
          start.setHours(0, 0, 0, 0);
          const now = new Date(today);
          now.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((now.getTime() - start.getTime()) / (86400000));
          return diffDays >= 0 && diffDays % p.repeatEvery === 0 && !existingProtocolIds.has(p.id);
        }

        const freq: string[] = Array.isArray(p.frequency)
          ? p.frequency
          : typeof p.frequency === "string"
          ? (JSON.parse(p.frequency as unknown as string) as string[])
          : [];
        // Match today's day-of-week AND make sure we haven't already generated it
        return freq.includes(todayDow) && !existingProtocolIds.has(p.id);
      });

      console.log(`[tasks GET] new eligible protocols missing tasks=${todaysProtocols.length}`);

      if (todaysProtocols.length > 0) {
        const newTasks = todaysProtocols.map((p) => ({
          userId,
          title: p.title,
          description: [p.duration, formatFreq(p.frequency, p.repeatEvery)].filter(Boolean).join(" / "),
          date: targetDateStr,
          completed: false,
          protocolId: p.id,
        }));
        const inserted = await db.insert(tasks).values(newTasks).onConflictDoNothing().returning();
        console.log(`[tasks GET] inserted ${newTasks.length} missing task(s)`);

        const all = [
          ...existing,
          ...inserted.map(t => {
            const p = todaysProtocols.find(pr => pr.id === t.protocolId);
            return {
              id: t.id,
              userId: t.userId,
              title: t.title,
              description: t.description,
              date: t.date,
              assignedDate: t.date,
              createdAt: t.createdAt,
              completed: t.completed,
              protocolId: t.protocolId,
              protocolSortOrder: p?.sortOrder ?? 0,
              protocolIcon: p?.icon,
            };
          })
        ];
        return Response.json(all);
      }
    }

    return Response.json(existing);
  } catch (err) {
    console.error("[tasks GET] ERROR:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* POST /api/tasks — create a manual task                             */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, description = "", date } = body;

  if (!title?.trim()) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }
  if (!date) {
    return Response.json({ error: "Date is required" }, { status: 400 });
  }

  const [task] = await db
    .insert(tasks)
    .values({ userId, title: title.trim(), description, date })
    .returning();

  return Response.json(task, { status: 201 });
}
