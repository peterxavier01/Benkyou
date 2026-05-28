import {
	integer,
	jsonb,
	pgTable,
	text,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { transcriptSourceEnum, videoProviderEnum } from "./enums";
import { createdAtColumn, idColumn, updatedAtColumn } from "./shared";

export const videos = pgTable(
	"videos",
	{
		id: idColumn(),
		provider: videoProviderEnum("provider").notNull(),
		providerVideoId: text("provider_video_id").notNull(),
		sourceUrl: text("source_url").notNull(),
		canonicalUrl: text("canonical_url"),
		title: text("title"),
		description: text("description"),
		thumbnailUrl: text("thumbnail_url"),
		channelName: text("channel_name"),
		channelUrl: text("channel_url"),
		durationSeconds: integer("duration_seconds"),
		transcriptSource: transcriptSourceEnum("transcript_source"),
		transcriptText: text("transcript_text"),
		rawMetadata: jsonb("raw_metadata").$type<Record<string, unknown>>(),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		uniqueIndex("videos_provider_video_idx").on(
			table.provider,
			table.providerVideoId,
		),
	],
);
