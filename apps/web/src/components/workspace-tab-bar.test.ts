import { describe, expect, it } from "vitest";
import { isImmersiveRoute } from "./workspace-tab-bar";

describe("isImmersiveRoute", () => {
	it("treats the notebook player as immersive", () => {
		expect(isImmersiveRoute("/courses/abc123")).toBe(true);
		expect(isImmersiveRoute("/courses/abc123/")).toBe(true);
	});

	it("keeps the tab bar everywhere else", () => {
		expect(isImmersiveRoute("/courses")).toBe(false);
		expect(isImmersiveRoute("/courses/abc123/manage")).toBe(false);
		expect(isImmersiveRoute("/courses/new/job-1")).toBe(false);
		expect(isImmersiveRoute("/courses/new")).toBe(false);
		expect(isImmersiveRoute("/bookmarks")).toBe(false);
		expect(isImmersiveRoute("/settings")).toBe(false);
	});
});
