CREATE TABLE `investor_shares` (
	`share_hash` text PRIMARY KEY NOT NULL,
	`owner_ename` text NOT NULL,
	`label` text NOT NULL,
	`expires_at` text,
	`revoked_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_investor_shares_owner_expires` ON `investor_shares` (`owner_ename`,`expires_at`);--> statement-breakpoint
CREATE TABLE `sensor_history_daily_points` (
	`owner_ename` text NOT NULL,
	`entity_id` text NOT NULL,
	`day` text NOT NULL,
	`value` real NOT NULL,
	`minimum` real,
	`maximum` real,
	`sample_count` integer NOT NULL,
	PRIMARY KEY(`owner_ename`, `entity_id`, `day`)
);
--> statement-breakpoint
CREATE INDEX `idx_sensor_history_daily_points_lookup` ON `sensor_history_daily_points` (`owner_ename`,`entity_id`,`day`);--> statement-breakpoint
CREATE TABLE `sensor_history_imports` (
	`owner_ename` text NOT NULL,
	`entity_id` text NOT NULL,
	`label` text NOT NULL,
	`device_label` text,
	`area_label` text,
	`group_id` text NOT NULL,
	`group_label` text NOT NULL,
	`unit` text,
	`unit_class` text,
	`aggregation` text NOT NULL,
	`is_archived` integer DEFAULT 0 NOT NULL,
	`first_observed_at` text NOT NULL,
	`data_through` text NOT NULL,
	`imported_at` text NOT NULL,
	`quality` text NOT NULL,
	`quality_detail` text,
	`point_count` integer NOT NULL,
	PRIMARY KEY(`owner_ename`, `entity_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_sensor_history_imports_group` ON `sensor_history_imports` (`owner_ename`,`group_id`,`label`);--> statement-breakpoint
CREATE TABLE `utility_history_daily_points` (
	`owner_ename` text NOT NULL,
	`utility` text NOT NULL,
	`day` text NOT NULL,
	`consumption` real NOT NULL,
	PRIMARY KEY(`owner_ename`, `utility`, `day`)
);
--> statement-breakpoint
CREATE INDEX `idx_utility_history_daily_points_lookup` ON `utility_history_daily_points` (`owner_ename`,`utility`,`day`);--> statement-breakpoint
CREATE TABLE `utility_history_imports` (
	`owner_ename` text NOT NULL,
	`utility` text NOT NULL,
	`source_label` text NOT NULL,
	`source_scope` text NOT NULL,
	`source_entity_id` text NOT NULL,
	`unit` text NOT NULL,
	`timezone` text NOT NULL,
	`first_observed_at` text NOT NULL,
	`data_through` text NOT NULL,
	`imported_at` text NOT NULL,
	`quality` text NOT NULL,
	`quality_detail` text,
	`rate_pence_per_unit` real,
	PRIMARY KEY(`owner_ename`, `utility`)
);
--> statement-breakpoint
ALTER TABLE `w3ds_auth_offers` ADD `failure_code` text;