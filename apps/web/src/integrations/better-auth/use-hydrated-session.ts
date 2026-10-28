import { authClient } from "@benkyou/auth/client";
import { useSyncExternalStore } from "react";

const subscribeToNothing = () => () => {};

/**
 * Session state that renders identically on the server and during hydration.
 * The server can't see the browser session, so we report `isPending` until the
 * client has hydrated, then defer to better-auth's live session state.
 *
 * Signed-out learners may hold an anonymous session that owns their
 * notebooks. It isn't an account, so it's reported as no session.
 */
export function useHydratedSession() {
	const session = authClient.useSession();
	const isHydrated = useSyncExternalStore(
		subscribeToNothing,
		() => true,
		() => false,
	);

	return {
		data: isHydrated && !session.data?.user.isAnonymous ? session.data : null,
		isPending: !isHydrated || session.isPending,
	};
}
