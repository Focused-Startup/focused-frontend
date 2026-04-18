CREATE TABLE IF NOT EXISTS `drawings` (
	`id` integer PRIMARY KEY,
	`name` text,
	`drawing_json` text,
	`preview_image` blob
);