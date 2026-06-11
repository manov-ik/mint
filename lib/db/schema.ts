import {
  pgTable,
  text,
  boolean,
  integer,
  uuid,
  date,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* Daily task instances — generated from protocols or added manually  */
/* ------------------------------------------------------------------ */

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").default(""),
  date: date("date").notNull(),
  completed: boolean("completed").default(false).notNull(),
  // Track which protocol generated this task (null = manually added)
  protocolId: uuid("protocol_id"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  // Prevent duplicate protocol tasks for the same day
  unique("tasks_protocol_date_unique").on(t.userId, t.protocolId, t.date),
]);

/* ------------------------------------------------------------------ */
/* Protocols                                                           */
/* Recurring habit templates                                           */
/* ------------------------------------------------------------------ */

export const protocols = pgTable("protocols", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  duration: text("duration").default(""),
  icon: text("icon").default("Zap"),
  sortOrder: integer("sort_order").default(0).notNull(),
  // Array of day codes: M T W Th F Sa Su
  frequency: text("frequency").array().default(["M", "T", "W", "Th", "F", "Sa", "Su"]).notNull(),
  repeatEvery: integer("repeat_every"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ------------------------------------------------------------------ */
/* User Settings                                                       */
/* ------------------------------------------------------------------ */

export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  showCompleted: boolean("show_completed").default(true).notNull(),
  moveUncompleted: boolean("move_uncompleted").default(true).notNull(),
  autoTomorrowHour: integer("auto_tomorrow_hour").default(18).notNull(),
  rolloverThreshold: integer("rollover_threshold").default(3).notNull(),
  theme: text("theme").default("dark").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Custom ID or UUID string
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Protocol = typeof protocols.$inferSelect;
export type NewProtocol = typeof protocols.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
