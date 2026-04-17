CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text,
	`overall_score_pct` integer,
	`tier` text,
	`dimension_scores` text,
	`weak_dimensions` text,
	`deployment_override` integer DEFAULT 0,
	`completed_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `engagement_events` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text,
	`event_type` text,
	`metadata` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `learning_paths` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text,
	`path_slug` text,
	`assigned_at` text DEFAULT (CURRENT_TIMESTAMP),
	`completed_at` text,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`member_id` text,
	`lesson_id` text,
	`status` text DEFAULT 'not_started',
	`started_at` text,
	`completed_at` text,
	PRIMARY KEY(`member_id`, `lesson_id`),
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`first_name` text,
	`role` text,
	`deployment` text,
	`tier` text,
	`stripe_customer_id` text,
	`membership_status` text DEFAULT 'free',
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_email_unique` ON `members` (`email`);