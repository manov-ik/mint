import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { and, eq, lt, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";

/* ------------------------------------------------------------------ */
/* POST /api/cron/rollover                                             */
/* Called nightly by Vercel Cron at 00:00 UTC                         */
/* Bumps all incomplete tasks from previous days to today             */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  // Verify cron secret so this endpoint can't be triggered by anyone
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Move all incomplete tasks that are overdue to today
  const result = await db
    .update(tasks)
    .set({ date: todayStr })
    .where(
      and(
        eq(tasks.completed, false),
        lt(tasks.date, todayStr),
        isNull(tasks.protocolId),
      ),
    )
    .returning({ id: tasks.id });

  return Response.json({ rolledOver: result.length, date: todayStr });
}
