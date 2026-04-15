CREATE TABLE `session_grounding` (
	`session_id` text PRIMARY KEY NOT NULL,
	`facts` text,
	`related_news` text,
	`sources` text,
	`model` text NOT NULL,
	`prompt_version` integer NOT NULL,
	`generated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session_scoring` (
	`session_id` text PRIMARY KEY NOT NULL,
	`scorecard` text NOT NULL,
	`model` text NOT NULL,
	`prompt_version` integer NOT NULL,
	`batch_id` text,
	`generated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session_writing` (
	`session_id` text PRIMARY KEY NOT NULL,
	`blurb` text NOT NULL,
	`potential_contenders_intro` text,
	`potential_contenders` text,
	`model` text NOT NULL,
	`prompt_version` integer NOT NULL,
	`batch_id` text,
	`generated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- Backfill staging tables from existing session_content rows so we don't lose
-- history on the switch. Facts weren't persisted previously, so grounding
-- rows carry NULL facts; the writing/scoring rows capture what's there.
INSERT OR IGNORE INTO `session_grounding` (`session_id`, `facts`, `related_news`, `sources`, `model`, `prompt_version`, `generated_at`)
SELECT
  session_id,
  NULL,
  related_news,
  json_extract(content_meta, '$.sources'),
  COALESCE(json_extract(content_meta, '$.groundingModel'), 'unknown'),
  0,
  COALESCE(json_extract(content_meta, '$.generatedAt'), '1970-01-01T00:00:00Z')
FROM `session_content`
WHERE related_news IS NOT NULL OR json_extract(content_meta, '$.sources') IS NOT NULL;
--> statement-breakpoint
INSERT OR IGNORE INTO `session_writing` (`session_id`, `blurb`, `potential_contenders_intro`, `potential_contenders`, `model`, `prompt_version`, `batch_id`, `generated_at`)
SELECT
  session_id,
  blurb,
  potential_contenders_intro,
  potential_contenders,
  COALESCE(json_extract(content_meta, '$.writingModel'), 'unknown'),
  0,
  NULL,
  COALESCE(json_extract(content_meta, '$.generatedAt'), '1970-01-01T00:00:00Z')
FROM `session_content`
WHERE blurb IS NOT NULL;
--> statement-breakpoint
INSERT OR IGNORE INTO `session_scoring` (`session_id`, `scorecard`, `model`, `prompt_version`, `batch_id`, `generated_at`)
SELECT
  session_id,
  scorecard,
  COALESCE(json_extract(content_meta, '$.scoringModel'), 'unknown'),
  0,
  NULL,
  COALESCE(json_extract(content_meta, '$.generatedAt'), '1970-01-01T00:00:00Z')
FROM `session_content`
WHERE scorecard IS NOT NULL;
