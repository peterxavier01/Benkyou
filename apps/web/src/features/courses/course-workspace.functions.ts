import { getCurrentUserFromHeaders } from "@benkyou/auth/server";
import {
	deleteCourseRequestV1Schema,
	getCoursePlayerDataRequestV1Schema,
	upsertChapterProgressRequestV1Schema,
	upsertCourseProgressRequestV1Schema,
} from "@benkyou/core";
import {
	getCourseByChapter,
	getCourseLibrary as getCourseLibraryRecords,
	getCoursePlayerData as getCoursePlayerDataRecord,
	softDeleteCourse,
	upsertChapterProgress as upsertChapterProgressRecord,
	upsertCourseProgress as upsertCourseProgressRecord,
} from "@benkyou/db";
import type {
	DeleteCourseResponseV1,
	GetCourseLibraryResponseV1,
	GetCoursePlayerDataResponseV1,
	UpsertChapterProgressResponseV1,
	UpsertCourseProgressResponseV1,
} from "@benkyou/types";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

export const getCourseLibrary = createServerFn({ method: "GET" }).handler(
	async (): Promise<GetCourseLibraryResponseV1> => {
		const ownerId = await getOptionalUserId();
		const items = await getCourseLibraryRecords(ownerId);

		return { items };
	},
);

export const getCoursePlayerData = createServerFn({ method: "POST" })
	.inputValidator((input) => getCoursePlayerDataRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<GetCoursePlayerDataResponseV1> => {
		const ownerId = await getOptionalUserId();
		const playerData = await getCoursePlayerDataRecord(data.courseId, ownerId);

		if (!playerData || !canAccessCourse(playerData.course.ownerId, ownerId)) {
			throw new Error("Course was not found.");
		}

		return { data: playerData };
	});

export const upsertCourseProgress = createServerFn({ method: "POST" })
	.inputValidator((input) => upsertCourseProgressRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<UpsertCourseProgressResponseV1> => {
		const ownerId = await getOptionalUserId();
		const playerData = await getCoursePlayerDataRecord(data.courseId, ownerId);

		if (!playerData || !canAccessCourse(playerData.course.ownerId, ownerId)) {
			throw new Error("Course was not found.");
		}

		const progress = await upsertCourseProgressRecord(ownerId, data.courseId, {
			resumeSeconds: data.resumeSeconds,
			completionPercent: data.completionPercent,
		});

		return { progress };
	});

export const upsertChapterProgress = createServerFn({ method: "POST" })
	.inputValidator((input) => upsertChapterProgressRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<UpsertChapterProgressResponseV1> => {
		const ownerId = await getOptionalUserId();
		const course =
			(await getCourseByChapter(data.chapterId, ownerId)) ??
			(ownerId ? await getCourseByChapter(data.chapterId, null) : null);

		if (!course) {
			throw new Error("Chapter was not found.");
		}

		const progress = await upsertChapterProgressRecord(
			ownerId,
			data.chapterId,
			{
				watchedSeconds: data.watchedSeconds,
				completed: data.completed,
			},
		);

		return { progress };
	});

export const deleteCourse = createServerFn({ method: "POST" })
	.inputValidator((input) => deleteCourseRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<DeleteCourseResponseV1> => {
		const ownerId = await getOptionalUserId();
		const deleted = await softDeleteCourse(data.courseId, ownerId);

		return { deleted };
	});

async function getOptionalUserId() {
	const user = await getCurrentUserFromHeaders(
		new Headers(getRequestHeaders()),
	);

	return user?.id ?? null;
}

function canAccessCourse(courseOwnerId: string | null, userId: string | null) {
	return courseOwnerId === userId || courseOwnerId === null;
}
