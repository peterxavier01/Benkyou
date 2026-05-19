import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
	async () => {
		const { getCurrentUserFromHeaders } = await import("./auth.server");

		return getCurrentUserFromHeaders(new Headers(getRequestHeaders()));
	},
);
