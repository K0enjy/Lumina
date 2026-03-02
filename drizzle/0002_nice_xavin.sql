CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_calendars` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`url` text NOT NULL,
	`display_name` text NOT NULL,
	`color` text DEFAULT '#3b82f6',
	`ctag` text,
	`sync_token` text,
	`is_local` integer DEFAULT false NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `caldav_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_calendars`("id", "account_id", "url", "display_name", "color", "ctag", "sync_token", "is_local", "enabled", "created_at", "updated_at") SELECT "id", "account_id", "url", "display_name", "color", "ctag", "sync_token", "is_local", "enabled", "created_at", "updated_at" FROM `calendars`;--> statement-breakpoint
DROP TABLE `calendars`;--> statement-breakpoint
ALTER TABLE `__new_calendars` RENAME TO `calendars`;--> statement-breakpoint
PRAGMA foreign_keys=ON;