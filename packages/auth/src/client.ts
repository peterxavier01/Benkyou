import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	plugins: [anonymousClient()],
});

export type AuthClient = typeof authClient;
export type AuthClientSession = AuthClient["$Infer"]["Session"];
