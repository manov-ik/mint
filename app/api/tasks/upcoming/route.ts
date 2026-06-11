import { getUserId } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and, sql, isNull, gt } from "drizzle-orm";
import { NextRequest } from "next/server";

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const today = new Date();
    const tomorrow = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    );
    const tomorrowStr = toDateStr(tomorrow);

    const upcomingTasksRaw = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        date: tasks.date,
        completed: tasks.completed,
        createdAt: tasks.createdAt,
        protocolId: tasks.protocolId,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          gt(sql`DATE(${tasks.date})`, tomorrowStr),
          eq(tasks.completed, false),
          isNull(tasks.protocolId)
        )
      );

    return Response.json(
      upcomingTasksRaw.map((t) => ({
        ...t,
        assignedDate: t.date,
        completed: t.completed,
      }))
    );
  } catch (err) {
    console.error("[tasks/upcoming GET] ERROR:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
