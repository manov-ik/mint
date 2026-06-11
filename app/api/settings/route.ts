import { getUserId } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { userSettings, protocols, tasks, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

/* ------------------------------------------------------------------ */
/* GET /api/settings — fetch (or create) settings for the user        */
/* PATCH /api/settings — update one or more settings                  */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Upsert: insert defaults if the row doesn't exist yet, otherwise do nothing.
  // This is atomic and safe against concurrent requests (no duplicate key errors).
  const [row] = await db
    .insert(userSettings)
    .values({ userId })
    .onConflictDoNothing()
    .returning();

  if (row) {
    // New User — Seed some starter data
    try {
      await db.insert(protocols).values({
        userId,
        title: "Morning Momentum",
        duration: "15 min",
        icon: "Zap",
        frequency: ["M", "T", "W", "Th", "F", "Sa", "Su"],
      });

      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const later = new Date(now);
      later.setDate(now.getDate() + 7);

      await db.insert(tasks).values([
        {
          userId,
          title: "Long press or right click me to edit",
          date: now.toISOString().split("T")[0],
        },
        {
          userId,
          title: "Go to Protocols to define your habits",
          date: now.toISOString().split("T")[0],
        },
        {
          userId,
          title: "Click + to add tasks for tomorrow or later",
          date: now.toISOString().split("T")[0],
        },
        {
          userId,
          title: "Delete these once you're ready to go!",
          date: now.toISOString().split("T")[0],
        },
        {
          userId,
          title: "Check tomorrow's plan",
          date: tomorrow.toISOString().split("T")[0],
        },
        {
          userId,
          title: "Example future task",
          date: later.toISOString().split("T")[0],
        }
      ]);
    } catch (e) {
      console.error("Seeding failed:", e);
    }
    return Response.json(row);
  }

  // Row already existed — fetch and return it
  const [existing] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  return Response.json(existing);
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { showCompleted, moveUncompleted, autoTomorrowHour, rolloverThreshold, theme } = body;

  // Upsert — insert if not exists, update if exists
  const [updated] = await db
    .insert(userSettings)
    .values({ userId, showCompleted, moveUncompleted, autoTomorrowHour, rolloverThreshold, theme })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { showCompleted, moveUncompleted, autoTomorrowHour, rolloverThreshold, theme },
    })
    .returning();

  return Response.json(updated);
}

export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Delete user tasks
    await db.delete(tasks).where(eq(tasks.userId, userId));
    // 2. Delete user protocols
    await db.delete(protocols).where(eq(protocols.userId, userId));
    // 3. Delete user settings
    await db.delete(userSettings).where(eq(userSettings.userId, userId));
    // 4. Delete user credentials record
    await db.delete(users).where(eq(users.id, userId));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return Response.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
