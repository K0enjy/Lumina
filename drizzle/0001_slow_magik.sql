CREATE TABLE `caldav_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`server_url` text NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`display_name` text NOT NULL,
	`last_sync_at` integer,
	`sync_token` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `calendars` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`url` text NOT NULL,
	`display_name` text NOT NULL,
	`color` text DEFAULT '#3b82f6',
	`ctag` text,
	`sync_token` text,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `caldav_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`calendar_id` text NOT NULL,
	`uid` text NOT NULL,
	`etag` text,
	`url` text,
	`title` text NOT NULL,
	`description` text DEFAULT '',
	`location` text DEFAULT '',
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`all_day` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'confirmed',
	`raw_ical` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`calendar_id`) REFERENCES `calendars`(`id`) ON UPDATE no action ON DELETE cascade
);
