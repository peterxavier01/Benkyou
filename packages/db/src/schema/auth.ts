import { relations } from "drizzle-orm";
import {
	boolean,
	doublePrecision,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import { createdAtColumn, updatedAtColumn } from "./shared";

export const authUser = pgTable(
	"user",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		email: text("email").notNull(),
		emailVerified: boolean("email_verified").notNull().default(false),
		image: text("image"),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const authSession = pgTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		token: text("token").notNull(),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => authUser.id, { onDelete: "cascade" }),
	},
	(table) => [
		uniqueIndex("session_token_unique").on(table.token),
		index("session_user_idx").on(table.userId),
	],
);

export const authAccount = pgTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => authUser.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at", {
			withTimezone: true,
		}),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
			withTimezone: true,
		}),
		scope: text("scope"),
		password: text("password"),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [index("account_user_idx").on(table.userId)],
);

export const authVerification = pgTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const learningPreferences = pgTable("learning_preferences", {
	userId: text("user_id")
		.primaryKey()
		.references(() => authUser.id, { onDelete: "cascade" }),
	playbackSpeed: doublePrecision("playback_speed").notNull().default(1),
	manualCompletionOnly: boolean("manual_completion_only")
		.notNull()
		.default(false),
	autoplayNextChapter: boolean("autoplay_next_chapter")
		.notNull()
		.default(false),
	createdAt: createdAtColumn(),
	updatedAt: updatedAtColumn(),
});

export const authUserRelations = relations(authUser, ({ many }) => ({
	accounts: many(authAccount),
	sessions: many(authSession),
}));

export const authSessionRelations = relations(authSession, ({ one }) => ({
	user: one(authUser, {
		fields: [authSession.userId],
		references: [authUser.id],
	}),
}));

export const authAccountRelations = relations(authAccount, ({ one }) => ({
	user: one(authUser, {
		fields: [authAccount.userId],
		references: [authUser.id],
	}),
}));
