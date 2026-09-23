CREATE TABLE `sensor_history_current_weeks` (
	`owner_ename` text NOT NULL,
	`entity_id` text NOT NULL,
	`week_start` text NOT NULL,
	`value` real NOT NULL,
	`minimum` real,
	`maximum` real,
	`day_count` integer NOT NULL,
	`observed_at` text NOT NULL,
	PRIMARY KEY(`owner_ename`, `entity_id`),
	FOREIGN KEY (`owner_ename`,`entity_id`) REFERENCES `sensor_history_imports`(`owner_ename`,`entity_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sensor_history_current_weeks_owner_week` ON `sensor_history_current_weeks` (`owner_ename`,`week_start`);
