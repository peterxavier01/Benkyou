import { getCurrentUserFromHeaders } from "@benkyou/auth/server";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
	async () => {
		return getCurrentUserFromHeaders(new Headers(getRequestHeaders()));
	},
);
