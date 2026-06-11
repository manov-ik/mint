import { pgTable, text, boolean, integer, uuid, date, timestamp, } from "drizzle-orm/pg-core";
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
});
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
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
