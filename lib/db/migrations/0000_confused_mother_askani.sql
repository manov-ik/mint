CREATE TABLE "protocols" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"duration" text DEFAULT '',
	"icon" text DEFAULT 'Zap',
	"sort_order" integer DEFAULT 0 NOT NULL,
	"frequency" text[] DEFAULT '{"M","T","W","Th","F","Sa","Su"}' NOT NULL,
	"repeat_every" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '',
	"date" date NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"protocol_id" uuid,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tasks_protocol_date_unique" UNIQUE("user_id","protocol_id","date")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"show_completed" boolean DEFAULT true NOT NULL,
	"move_uncompleted" boolean DEFAULT true NOT NULL,
	"auto_tomorrow_hour" integer DEFAULT 18 NOT NULL,
	"rollover_threshold" integer DEFAULT 3 NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
