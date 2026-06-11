import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";
import path from "path";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });

if (process.env.NODE_ENV === "production" && !process.env.DISABLE_AUTO_MIGRATE) {
  console.log("Checking and running database migrations...");
  migrate(db, { migrationsFolder: path.join(process.cwd(), "lib/db/migrations") })
    .then(() => console.log("Database migrations applied successfully."))
    .catch((err) => console.error("Error applying database migrations:", err));
}
