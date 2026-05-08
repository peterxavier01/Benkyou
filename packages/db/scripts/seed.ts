import { and, eq, isNull } from "drizzle-orm";

import { db } from "../src/drizzle";
import {
    bookmarks,
    courseChapters,
    courseGenerationJobs,
    courses,
} from "../src/schema";
import {
    upsertChapterNote,
    upsertChapterProgress,
    upsertCourseProgress,
    upsertVideoByProvider,
} from "../src/repositories";

const SAMPLE_PROVIDER_VIDEO_ID = "benkyou-sample-course";

const sampleChapters = [
    {
        title: "Map the learning goal",
        summary: "Define what the learner should be able to do after the session.",
        orderIndex: 0,
        startSeconds: 0,
        endSeconds: 240,
    },
    {
        title: "Break down the source material",
        summary: "Turn a long explanation into smaller study sections.",
        orderIndex: 1,
        startSeconds: 240,
        endSeconds: 620,
    },
    {
        title: "Capture active notes",
        summary: "Tie notes to the chapter where the idea appears.",
        orderIndex: 2,
        startSeconds: 620,
        endSeconds: 980,
    },
    {
        title: "Bookmark useful timestamps",
        summary: "Save moments that are worth revisiting later.",
        orderIndex: 3,
        startSeconds: 980,
        endSeconds: 1260,
    },
    {
        title: "Resume with context",
        summary: "Use progress and completion state to restart quickly.",
        orderIndex: 4,
        startSeconds: 1260,
        endSeconds: 1560,
    },
];

async function seed() {
    const video = await upsertVideoByProvider("youtube", SAMPLE_PROVIDER_VIDEO_ID, {
        sourceUrl: "https://www.youtube.com/watch?v=benkyou-sample-course",
        canonicalUrl: "https://www.youtube.com/watch?v=benkyou-sample-course",
        title: "Benkyou Sample: Turn a Video into a Course",
        description:
            "A deterministic mock video used to exercise the Benkyou MVP learning loop.",
        thumbnailUrl: "https://img.youtube.com/vi/benkyou-sample-course/maxresdefault.jpg",
        channelName: "Benkyou",
        channelUrl: "https://www.youtube.com/@benkyou",
        durationSeconds: 1560,
        transcriptSource: "sample",
        transcriptText:
            "This sample transcript stands in for generated course content during MVP development.",
        rawMetadata: { seeded: true },
    });

    const [existingCourse] = await db
        .select()
        .from(courses)
        .where(
            and(
                eq(courses.videoId, video.id),
                isNull(courses.ownerId),
                isNull(courses.deletedAt),
            ),
        )
        .limit(1);

    const [course] = existingCourse
        ? await db
            .update(courses)
            .set({
                title: "Benkyou Sample Course",
                description:
                    "A seeded course for validating chapters, notes, bookmarks, and progress.",
                visibility: "private",
                updatedAt: new Date(),
            })
            .where(eq(courses.id, existingCourse.id))
            .returning()
        : await db
            .insert(courses)
            .values({
                videoId: video.id,
                ownerId: null,
                title: "Benkyou Sample Course",
                description:
                    "A seeded course for validating chapters, notes, bookmarks, and progress.",
                visibility: "private",
            })
            .returning();

    const seededChapters = [];

    for (const chapter of sampleChapters) {
        const [seededChapter] = await db
            .insert(courseChapters)
            .values({
                courseId: course.id,
                ...chapter,
            })
            .onConflictDoUpdate({
                target: [courseChapters.courseId, courseChapters.orderIndex],
                set: {
                    title: chapter.title,
                    summary: chapter.summary,
                    startSeconds: chapter.startSeconds,
                    endSeconds: chapter.endSeconds,
                    updatedAt: new Date(),
                },
            })
            .returning();

        seededChapters.push(seededChapter);
    }

    const [existingJob] = await db
        .select()
        .from(courseGenerationJobs)
        .where(eq(courseGenerationJobs.courseId, course.id))
        .limit(1);

    if (existingJob) {
        await db
            .update(courseGenerationJobs)
            .set({
                status: "completed",
                transcriptSource: "sample",
                failureReason: null,
                retryable: false,
                completedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(courseGenerationJobs.id, existingJob.id));
    } else {
        await db.insert(courseGenerationJobs).values({
            courseId: course.id,
            status: "completed",
            transcriptSource: "sample",
            retryable: false,
            completedAt: new Date(),
            rawOutput: { seeded: true, chapterCount: seededChapters.length },
        });
    }

    await upsertCourseProgress(null, course.id, {
        resumeSeconds: 690,
        completionPercent: 42,
    });

    for (const [index, chapter] of seededChapters.entries()) {
        await upsertChapterProgress(null, chapter.id, {
            watchedSeconds: index < 2 ? 240 : 60,
            completed: index < 2,
        });
    }

    await upsertChapterNote(
        null,
        seededChapters[1].id,
        "The structure layer is the product value: chapters, notes, bookmarks, and progress stay connected.",
    );
    await upsertChapterNote(
        null,
        seededChapters[2].id,
        "Markdown notes should follow the selected chapter and survive refresh.",
    );

    const sampleBookmarks = [
        {
            timestampSeconds: 312,
            chapterId: seededChapters[1].id,
            title: "Course structure starts here",
            note: "Good moment to revisit before building the chapter sidebar.",
        },
        {
            timestampSeconds: 742,
            chapterId: seededChapters[2].id,
            title: "Notes workflow",
            note: "Connect autosave state to the selected chapter.",
        },
        {
            timestampSeconds: 1330,
            chapterId: seededChapters[4].id,
            title: "Resume behavior",
            note: "Progress should restore context, not just a percentage.",
        },
    ];

    for (const bookmark of sampleBookmarks) {
        const [existingBookmark] = await db
            .select()
            .from(bookmarks)
            .where(
                and(
                    eq(bookmarks.courseId, course.id),
                    eq(bookmarks.timestampSeconds, bookmark.timestampSeconds),
                    isNull(bookmarks.userId),
                    isNull(bookmarks.deletedAt),
                ),
            )
            .limit(1);

        if (existingBookmark) {
            await db
                .update(bookmarks)
                .set({ ...bookmark, updatedAt: new Date() })
                .where(eq(bookmarks.id, existingBookmark.id));
        } else {
            await db.insert(bookmarks).values({
                userId: null,
                courseId: course.id,
                ...bookmark,
            });
        }
    }

    console.log(`Seeded sample course: ${course.id}`);
}

seed().catch((error) => {
    console.error("Seed failed.");
    console.error(error);
    process.exitCode = 1;
});
