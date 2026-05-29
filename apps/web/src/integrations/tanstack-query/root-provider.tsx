import { QueryClient } from "@tanstack/react-query";

export function getContext() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				gcTime: 10 * 60 * 1000,
				refetchOnWindowFocus: false,
				retry: 1,
				staleTime: 60 * 1000,
			},
		},
	});

	return {
		queryClient,
	};
}
export default function TanstackQueryProvider() {}
