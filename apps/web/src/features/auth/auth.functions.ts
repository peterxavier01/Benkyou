import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

/** The signed-in account, or null for signed-out and anonymous learners. */
export const getCurrentUser = createServerFn({ method: "GET" }).handler(
	async () => {
		const { getCurrentUserFromHeaders } = await import("./auth.server");
		const user = await getCurrentUserFromHeaders(
			new Headers(getRequestHeaders()),
		);

		return user?.isAnonymous ? null : user;
	},
);
