import { getUserId } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { protocols } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

/* ------------------------------------------------------------------ */
/* GET /api/protocols — fetch all protocols for the user              */
/* POST /api/protocols — create a new protocol                        */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select()
    .from(protocols)
    .where(eq(protocols.userId, userId))
    .orderBy(protocols.sortOrder);

  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, duration = "", frequency, repeatEvery, icon } = body;

  if (!title?.trim()) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  // Put new protocol at the end
  const existing = await db
    .select({ sortOrder: protocols.sortOrder })
    .from(protocols)
    .where(eq(protocols.userId, userId));
  const maxOrder = existing.reduce((m, p) => Math.max(m, p.sortOrder), -1);

  const [protocol] = await db
    .insert(protocols)
    .values({
      userId,
      title: title.trim(),
      duration,
      icon: icon ?? "Zap",
      frequency: frequency ?? [],
      repeatEvery: repeatEvery ?? null,
      sortOrder: maxOrder + 1,
    })
    .returning();

  return Response.json(protocol, { status: 201 });
}
