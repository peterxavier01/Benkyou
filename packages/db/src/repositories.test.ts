import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";

import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";

config({
    path: [
        "../../apps/web/.env.local",
        "../../apps/web/.env",
        "../../.env.local",
        "../../.env",
        ".env.local",
        ".env",
    ],
});

test(
    "repository helpers upsert learning data into DTO-compatible course data",
    { skip: !process.env.DATABASE_URL },
    async (t) => {
        const modules = await import("./repositories");
        const schema = await import("./schema");
        const database = (await import("./drizzle")).db;
        let courseId: string | null = null;

        try {
            await database.execute(sql`select 1`);
        } catch {
            t.skip("DATABASE_URL is configured, but Postgres is not reachable.");
            return;
        }

        const providerVideoId = `repository-test-${randomUUID()}`;
        const video = await modules.upsertVideoByProvider("youtube", providerVideoId, {
            sourceUrl: `https://www.youtube.com/watch?v=${providerVideoId}`,
            canonicalUrl: `https://www.youtube.com/watch?v=${providerVideoId}`,
            title: "Repository Test Video",
            channelName: "Benkyou Tests",
            transcriptSource: "sample",
        });

        const updatedVideo = await modules.upsertVideoByProvider(
            "youtube",
            providerVideoId,
            {
                sourceUrl: `https://www.youtube.com/watch?v=${providerVideoId}`,
                canonicalUrl: `https://www.youtube.com/watch?v=${providerVideoId}`,
                title: "Repository Test Video Updated",
                channelName: "Benkyou Tests",
                transcriptSource: "sample",
            },
        );

        assert.equal(updatedVideo.id, video.id);
        assert.equal(updatedVideo.title, "Repository Test Video Updated");

        try {
            const [course] = await database
                .insert(schema.courses)
                .values({
                    videoId: video.id,
                    ownerId: null,
                    title: "Repository Test Course",
                    visibility: "private",
                })
                .returning();
            courseId = course.id;

            const [secondChapter] = await database
                .insert(schema.courseChapters)
                .values({
                    courseId: course.id,
                    title: "Second chapter",
                    orderIndex: 1,
                    startSeconds: 60,
                    endSeconds: 120,
                })
                .returning();

            const [firstChapter] = await database
                .insert(schema.courseChapters)
                .values({
                    courseId: course.id,
                    title: "First chapter",
                    orderIndex: 0,
                    startSeconds: 0,
                    endSeconds: 60,
                })
                .returning();

            await modules.upsertCourseProgress(null, course.id, {
                resumeSeconds: 45,
                completionPercent: 50,
            });
            await modules.upsertChapterProgress(null, firstChapter.id, {
                watchedSeconds: 55,
                completed: true,
            });
            await modules.upsertChapterNote(
                null,
                firstChapter.id,
                "A durable note.",
            );

            const bookmark = await modules.createBookmark({
                userId: null,
                courseId: course.id,
                chapterId: firstChapter.id,
                timestampSeconds: 32,
                title: "Important timestamp",
            });

            const updatedBookmark = await modules.updateBookmark(bookmark.id, null, {
                title: "Updated timestamp",
                note: "Worth revisiting.",
            });

            assert.equal(updatedBookmark?.title, "Updated timestamp");

            const data = await modules.getCoursePlayerData(course.id, null);

            assert.equal(data?.video.id, video.id);
            assert.deepEqual(
                data?.chapters.map((chapter) => chapter.id),
                [firstChapter.id, secondChapter.id],
            );
            assert.equal(data?.progress?.resumeSeconds, 45);
            assert.equal(data?.chapterProgress[0]?.completed, true);
            assert.equal(data?.notes[0]?.markdown, "A durable note.");
            assert.equal(data?.bookmarks[0]?.title, "Updated timestamp");

            assert.equal(await modules.deleteBookmark(bookmark.id, null), true);

            const dataAfterDelete = await modules.getCoursePlayerData(course.id, null);
            assert.equal(dataAfterDelete?.bookmarks.length, 0);

            const library = await modules.getCourseLibrary(null);
            assert.equal(
                library.some((item) => item.course.id === course.id),
                true,
            );
        } finally {
            if (courseId) {
                await database
                    .update(schema.courses)
                    .set({ deletedAt: new Date(), updatedAt: new Date() })
                    .where(eq(schema.courses.id, courseId));
            }
        }
    },
);
