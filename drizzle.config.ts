import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// drizzle-kit doesn't auto-load Next.js .env.local — load it explicitly
config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
