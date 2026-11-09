import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const skill = readFileSync(join(import.meta.dirname, "..", "skills/branch-pr/SKILL.md"), "utf8");

test("clear PR requests authorize necessary operations while preserving target boundaries", () => {
	assert.match(skill, /clear request.*create a PR authorizes.*target-host reads.*creating a branch, committing and pushing/i);
	assert.match(skill, /Ask when the destination, identity, or intended action is materially ambiguous/i);
	assert.match(skill, /creating a PR does not authorize merging, destructive operations/i);
	assert.match(skill, /reuse fresh target-bound evidence/i);
});

test("issues are optional and protected labels retain human decisions", () => {
	assert.match(skill, /issue is optional unless the destination requires one or the user requests one/i);
	assert.match(skill, /never create one solely to enable a PR unless required by destination policy or requested/i);
	assert.match(skill, /closing.*nonclosing `Refs #N`/i);
	assert.doesNotMatch(skill, /status:approved|every PR must link an approved issue/i);
	assert.match(skill, /protected labels.*exact direct instruction.*MAINTAIN\/ADMIN/i);
	assert.match(skill, /human-selected.*size:exception.*rationale.*no separate instructor proof/i);
	assert.doesNotMatch(skill, /Every PR body MUST contain:[\s\S]*?```markdown\s*Closes #<issue-number>/i);
});

test("oversized single PR does not impose Gentle size labels on generic users", () => {
	assert.match(skill, /size:exception.*Gentle-owned.*not.*universal/i);
	assert.match(skill, /destination repository's documented contribution\/size policy/i);
	assert.match(skill, /only when.*policy.*size:exception/i);
	assert.match(skill, /(?:never|do not).*request.*(?:create|add).*label.*generic/i);
	assert.match(skill, /single-pr.*not.*(?:waive|bypass).*authorization/i);
});

test("required checks and conventions are target-policy based", () => {
	assert.match(skill, /REQUIRED CI.*target policy/i);
	assert.match(skill, /CodeRabbit.*optional.*unless required/i);
	assert.match(skill, /repository has no branch naming convention.*suggested default/i);
	assert.match(skill, /repository's commit message convention.*none exists.*suggested default/i);
	assert.match(skill, /do not require a `type:\*` label if the target does not use or require one/i);
	assert.match(skill, /PR template when present/i);
	assert.match(skill, /applicable test-first/i);
	assert.match(skill, /advisory 400/i);
	assert.doesNotMatch(skill, /\bSDD\b|OpenSpec|TUI Strict TDD/i);
});

test("template checklist reflects evidence rather than pre-checked assertions", () => {
	assert.match(skill, /(?:do not|never).*unverified `?\[x\]`?/i);
	assert.doesNotMatch(skill, /^- \[x\]/m);
	assert.match(skill, /shellcheck on modified scripts/i);
	assert.match(skill, /skills.*at least one agent/i);
});
