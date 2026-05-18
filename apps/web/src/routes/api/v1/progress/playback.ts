import { getCurrentUserFromHeaders } from "@benkyou/auth/server";
import { upsertPlaybackProgressRequestV1Schema } from "@benkyou/core";
import { createFileRoute } from "@tanstack/react-router";
import { upsertPlaybackProgressForOwner } from "#/features/courses/course-workspace.functions";

export const Route = createFileRoute("/api/v1/progress/playback")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const input = upsertPlaybackProgressRequestV1Schema.parse(
						await request.json(),
					);
					const user = await getCurrentUserFromHeaders(request.headers);
					const result = await upsertPlaybackProgressForOwner(
						user?.id ?? null,
						input,
					);

					return jsonResponse(result);
				} catch (error) {
					return jsonResponse(
						{
							error:
								error instanceof Error
									? error.message
									: "Progress could not be saved.",
						},
						400,
					);
				}
			},
		},
	},
});

function jsonResponse(data: unknown, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
		},
	});
}
