import { test } from "node:test";
import assert from "node:assert/strict";
import { installationFollowup } from "./installer-followup.mjs";

test("installer opens interactive Pi for a safe additional-package assessment", () => {
	const args = installationFollowup();
	assert.equal(args[0], "--");
	assert.match(args[1], /paquetes adicionales/i);
	assert.match(args[1], /confirmación/i);
	assert.match(args[1], /npm:gentle-pi/);
	assert.match(args[1], /Engram/i);
});
