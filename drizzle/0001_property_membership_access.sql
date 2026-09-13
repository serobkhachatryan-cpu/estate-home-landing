CREATE TABLE `app_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text NOT NULL,
	`last_seen_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `property_memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'owner' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `app_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_property_memberships_property_user` ON `property_memberships` (`property_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_property_memberships_user` ON `property_memberships` (`user_id`);--> statement-breakpoint
ALTER TABLE `properties` ADD `area` text NOT NULL DEFAULT 'London';
