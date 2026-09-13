CREATE TABLE `home_assistant_auth_offers` (
	`session_id` text PRIMARY KEY NOT NULL,
	`owner_ename` text NOT NULL,
	`instance_url` text NOT NULL,
	`electricity_entity_id` text NOT NULL,
	`water_entity_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_home_assistant_auth_offers_expires` ON `home_assistant_auth_offers` (`expires_at`);--> statement-breakpoint
CREATE TABLE `home_assistant_connections` (
	`owner_ename` text PRIMARY KEY NOT NULL,
	`instance_url` text NOT NULL,
	`client_id` text NOT NULL,
	`electricity_entity_id` text NOT NULL,
	`water_entity_id` text NOT NULL,
	`access_token_encrypted` text NOT NULL,
	`refresh_token_encrypted` text NOT NULL,
	`access_token_expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
