import { describe, expect, it } from "vitest";
import { toNotebookUrl } from "./legacy-course-urls";

describe("toNotebookUrl", () => {
	it("moves old course URLs under /notebooks", () => {
		expect(toNotebookUrl("/courses")).toBe("/notebooks");
		expect(toNotebookUrl("/courses?q=go&filter=all")).toBe(
			"/notebooks?q=go&filter=all",
		);
		expect(toNotebookUrl("/courses/abc?chapter=c1#notes")).toBe(
			"/notebooks/abc?chapter=c1#notes",
		);
		expect(toNotebookUrl("/courses/abc/manage")).toBe(
			"/notebooks/abc/manage",
		);
		expect(toNotebookUrl("/courses/new/job-1")).toBe("/notebooks/new/job-1");
	});

	it("leaves other paths alone", () => {
		expect(toNotebookUrl("/coursesx")).toBe("/coursesx");
		expect(toNotebookUrl("/shelves/courses")).toBe("/shelves/courses");
	});
});
