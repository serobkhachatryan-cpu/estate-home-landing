CREATE TABLE `properties` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`currency` text DEFAULT 'GBP' NOT NULL,
	`timezone` text DEFAULT 'Europe/London' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `spend_records` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`supplier` text,
	`amount_pence` integer NOT NULL,
	`entry_date` text NOT NULL,
	`kind` text DEFAULT 'fact' NOT NULL,
	`status` text DEFAULT 'posted' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_spend_records_property_date` ON `spend_records` (`property_id`,`entry_date`);