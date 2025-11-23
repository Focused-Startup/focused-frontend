CREATE TABLE IF NOT EXISTS `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL
);