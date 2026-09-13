CREATE TABLE `w3ds_auth_offers` (
	`session_id` text PRIMARY KEY NOT NULL,
	`browser_proof_hash` text NOT NULL,
	`return_to` text NOT NULL,
	`expires_at` text NOT NULL,
	`completed_ename` text,
	`completed_at` text,
	`claimed_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_w3ds_auth_offers_expires` ON `w3ds_auth_offers` (`expires_at`);--> statement-breakpoint
CREATE TABLE `w3ds_auth_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`ename` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_w3ds_auth_sessions_expires` ON `w3ds_auth_sessions` (`expires_at`);