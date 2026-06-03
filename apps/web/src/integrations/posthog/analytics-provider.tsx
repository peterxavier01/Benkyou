import { authClient } from "@benkyou/auth/client";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import {
	identifyAnalyticsUser,
	initializeAnalytics,
	resetAnalyticsUser,
} from "./analytics";

interface AnalyticsProviderProps {
	children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
	return (
		<>
			<AnalyticsInitializer />
			<AnalyticsIdentity />
			{children}
		</>
	);
}

function AnalyticsInitializer() {
	useEffect(() => {
		initializeAnalytics();
	}, []);

	return null;
}

function AnalyticsIdentity() {
	const { data: session, isPending } = authClient.useSession();
	const identifiedUserIdRef = useRef<string | null>(null);
	const user = session?.user;

	useEffect(() => {
		if (isPending) {
			return;
		}

		if (user?.id) {
			if (identifiedUserIdRef.current !== user.id) {
				identifyAnalyticsUser({
					id: user.id,
					email: user.email,
					name: user.name,
				});
				identifiedUserIdRef.current = user.id;
			}
			return;
		}

		if (identifiedUserIdRef.current) {
			resetAnalyticsUser();
			identifiedUserIdRef.current = null;
		}
	}, [isPending, user?.email, user?.id, user?.name]);

	return null;
}
