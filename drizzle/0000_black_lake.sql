CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`monogram` text NOT NULL,
	`description` text NOT NULL,
	`href` text,
	`app_href` text,
	`code` text,
	`action_label` text NOT NULL,
	`accent` text NOT NULL,
	`tips_json` text DEFAULT '[]' NOT NULL,
	`notice` text DEFAULT '' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`last_verified_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `entries_category_enabled_sort_idx` ON `entries` (`category`,`enabled`,`sort_order`);--> statement-breakpoint
CREATE INDEX `entries_last_verified_at_idx` ON `entries` (`last_verified_at`);