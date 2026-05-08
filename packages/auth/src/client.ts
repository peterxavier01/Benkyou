import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export type AuthClient = typeof authClient;
export type AuthClientSession = AuthClient["$Infer"]["Session"];
