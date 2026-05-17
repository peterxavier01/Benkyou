import { redirect } from "@tanstack/react-router";

import { getCurrentUser } from "./auth.functions";

export async function requireSignedIn(locationHref: string) {
	const user = await getCurrentUser();

	if (!user) {
		throw redirect({
			to: "/sign-in",
			search: {
				redirect: locationHref,
			},
			replace: true,
		});
	}

	return user;
}
