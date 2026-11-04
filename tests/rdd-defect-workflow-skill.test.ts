import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const skill = readFileSync(join(import.meta.dirname, "..", "skills/rdd-defect-workflow/SKILL.md"), "utf8");

test("RDD defect work does not impose an issue or approval label", () => {
	assert.match(skill, /do not require an issue before implementation unless repository policy or the user requires one/i);
	assert.match(skill, /do not create one solely to enable a PR unless required by policy or requested/i);
	assert.doesNotMatch(skill, /status:approved|require an approved issue/i);
});

test("RDD defect work retains its existing delivery and evidence safeguards", () => {
	assert.match(skill, /hard limit is 400 additions plus deletions/i);
	assert.match(skill, /above it, STOP for a chain or explicit maintainer-approved exception/i);
	assert.match(skill, /reproduce on the current integration base before implementation/i);
});
