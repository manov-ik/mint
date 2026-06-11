import { getUserId } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { protocols } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest } from "next/server";

/* ------------------------------------------------------------------ */
/* PATCH /api/protocols/[id] — update protocol (reorder, title, etc) */
/* DELETE /api/protocols/[id] — delete a protocol                    */
/* ------------------------------------------------------------------ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // Strip any fields that shouldn't be updated directly
  const { userId: _u, id: _i, createdAt: _c, ...safeBody } = body;

  const [updated] = await db
    .update(protocols)
    .set(safeBody)
    .where(and(eq(protocols.id, id), eq(protocols.userId, userId)))
    .returning();

  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await db
    .delete(protocols)
    .where(and(eq(protocols.id, id), eq(protocols.userId, userId)));

  return new Response(null, { status: 204 });
}
