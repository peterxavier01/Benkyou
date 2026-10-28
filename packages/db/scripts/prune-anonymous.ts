import { pruneAnonymousUsers } from "../src/learner-transfer";

/*
 * Deletes anonymous learners, and their notebooks and shelves, after a
 * period with no session activity. Run it on a schedule, for example daily.
 * ANONYMOUS_RETENTION_DAYS sets the period (default 90).
 */

const days = Number.parseInt(process.env.ANONYMOUS_RETENTION_DAYS ?? "", 10);
const retentionDays = Number.isFinite(days) && days > 0 ? days : 90;
const before = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

pruneAnonymousUsers(before)
	.then((count) => {
		console.log(
			`Removed ${count} anonymous learner(s) inactive for ${retentionDays} days.`,
		);
		process.exit(0);
	})
	.catch((error) => {
		console.error("Pruning anonymous learners failed.");
		console.error(error);
		process.exit(1);
	});
