CREATE TABLE `videos` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`title` text NOT NULL,
	`r2_key` text NOT NULL,
	`r2_url` text,
	`duration_seconds` integer,
	`transcript` text,
	`transcript_segments` text,
	`status` text DEFAULT 'uploading' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
