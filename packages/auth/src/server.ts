import {
	authAccount,
	authSession,
	authUser,
	authVerification,
	db,
	transferLearnerData,
} from "@benkyou/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL,
	secret: process.env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: authUser,
			session: authSession,
			account: authAccount,
			verification: authVerification,
		},
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
		maxPasswordLength: 128,
	},
	session: {
		// Signed-out learners keep their notebooks only while this session
		// lasts, so it outlives the 7-day default.
		expiresIn: 60 * 60 * 24 * 60,
	},
	plugins: [
		// Signed-out learners get a private anonymous user. When they sign up
		// or sign in, their data moves to the account and the plugin deletes
		// the anonymous user.
		anonymous({
			emailDomainName: "anonymous.benkyou.invalid",
			onLinkAccount: async ({ anonymousUser, newUser }) => {
				await transferLearnerData(anonymousUser.user.id, newUser.user.id);
			},
		}),
		tanstackStartCookies(),
	],
});

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = AuthSession["user"];

export async function getSessionFromHeaders(headers: Headers) {
	return auth.api.getSession({ headers });
}

export async function getCurrentUserFromHeaders(headers: Headers) {
	const session = await getSessionFromHeaders(headers);

	return session?.user ?? null;
}

export function isAnonymousUser(user: AuthUser | null) {
	return user?.isAnonymous === true;
}

/**
 * Returns the current user, creating an anonymous one for a signed-out
 * learner. Call it only where the learner is about to save something, so
 * visitors who never save don't create users.
 */
export async function ensureLearnerFromHeaders(headers: Headers) {
	const user = await getCurrentUserFromHeaders(headers);
	if (user) {
		return user;
	}

	const result = await auth.api.signInAnonymous({ headers });
	if (!result) {
		throw new Error("Could not start a signed-out session.");
	}
	return { ...result.user, isAnonymous: true };
}

export async function requireCurrentUserFromHeaders(headers: Headers) {
	const user = await getCurrentUserFromHeaders(headers);

	if (!user) {
		throw new Error("Authentication required.");
	}

	return user;
}
