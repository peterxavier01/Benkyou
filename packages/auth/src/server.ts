import {
  authAccount,
  authSession,
  authUser,
  authVerification,
  db,
} from "@benkyou/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
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
  plugins: [tanstackStartCookies()],
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

export async function requireCurrentUserFromHeaders(headers: Headers) {
  const user = await getCurrentUserFromHeaders(headers);

  if (!user) {
    throw new Error("Authentication required.");
  }

  return user;
}
