CREATE TABLE `home_assistant_live_states` (
	`owner_ename` text NOT NULL,
	`entity_id` text NOT NULL,
	`group_id` text NOT NULL,
	`label` text NOT NULL,
	`state` text NOT NULL,
	`unit` text,
	`state_updated_at` text NOT NULL,
	`observed_at` text NOT NULL,
	PRIMARY KEY(`owner_ename`, `entity_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_home_assistant_live_states_owner_group` ON `home_assistant_live_states` (`owner_ename`,`group_id`,`label`);
