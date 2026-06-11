import { getUserId } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

/* ------------------------------------------------------------------ */
/* DELETE /api/tasks/clear — wipe all task history for the user       */
/* Protocols and settings are untouched.                              */
/* ------------------------------------------------------------------ */

export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(tasks).where(eq(tasks.userId, userId));
  return new Response(null, { status: 204 });
}
