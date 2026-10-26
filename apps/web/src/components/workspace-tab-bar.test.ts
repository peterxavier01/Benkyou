import { describe, expect, it } from "vitest";
import { isImmersiveRoute } from "./workspace-tab-bar";

describe("isImmersiveRoute", () => {
	it("treats the notebook player as immersive", () => {
		expect(isImmersiveRoute("/notebooks/abc123")).toBe(true);
		expect(isImmersiveRoute("/notebooks/abc123/")).toBe(true);
	});

	it("keeps the tab bar everywhere else", () => {
		expect(isImmersiveRoute("/notebooks")).toBe(false);
		expect(isImmersiveRoute("/notebooks/abc123/manage")).toBe(false);
		expect(isImmersiveRoute("/notebooks/new/job-1")).toBe(false);
		expect(isImmersiveRoute("/notebooks/new")).toBe(false);
		expect(isImmersiveRoute("/bookmarks")).toBe(false);
		expect(isImmersiveRoute("/settings")).toBe(false);
	});
});
