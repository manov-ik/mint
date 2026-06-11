import { getUserId } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { tasks, protocols } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  try {
    // Fetch all tasks for the user, joined with protocols to get the source if any
    const allTasks = await db
      .select({
        date: tasks.date,
        title: tasks.title,
        description: tasks.description,
        completed: tasks.completed,
        protocolTitle: protocols.title,
        createdAt: tasks.createdAt,
        completedAt: tasks.completedAt,
      })
      .from(tasks)
      .leftJoin(protocols, eq(tasks.protocolId, protocols.id))
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.date));

    // Build CSV string
    const headers = ["Title", "Description", "Completed", "Created Date", "Completed Date"];
    
    // Helper to escape CSV values
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = allTasks.map(t => [
      t.title,
      t.description,
      t.completed ? "Yes" : "No",
      t.createdAt ? new Date(t.createdAt).toISOString().split("T")[0] : "",
      t.completedAt ? new Date(t.completedAt).toISOString().split("T")[0] : ""
    ].map(escapeCsv).join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mint_archive_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (err) {
    console.error("[export GET] ERROR:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
