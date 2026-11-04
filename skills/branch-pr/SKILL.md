---
name: gentle-ai-branch-pr
description: "Prepare and create pull requests using the target repository's conventions. Trigger: creating, opening, or preparing PRs for review."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

## When to Use

Use this skill when:
- Creating a pull request for any change
- Preparing a branch for submission
- Helping a contributor open a PR

---

## Critical Rules

1. Follow the target repository's actual contribution requirements; do not impose Gentle-specific policy on other repositories.
2. An issue is optional unless the destination requires one or the user requests one. Link an existing relevant issue when appropriate; never create one solely to enable a PR unless required by destination policy or requested by the user.
3. Use labels only when the repository uses or requires them, or the user requests them.
4. **REQUIRED CI must pass according to target policy** before merge; CodeRabbit is optional unless required by that policy.

---

## Target and Authorization

- Inspect `origin` locally (`git remote get-url origin`) and establish one unambiguous target host and `owner/repo`. Do not infer the target from the cwd or assume `main`. Stop if ambiguous.
- A clear request to work on a branch or create a PR authorizes the necessary target-host reads and the operations reasonably needed for that requested outcome, including creating a branch, committing and pushing when needed to create the requested PR. Use the configured credential/session without a separate permission prompt; do not switch identities or targets implicitly. Ask when the destination, identity, or intended action is materially ambiguous.
- Reuse fresh target-bound evidence, including the default branch, applicable labels, checks and any relevant issue, instead of repeating discovery. Refresh stale or mismatched evidence; do not substitute another host's data. Resolve the base from the target's default branch or a human-selected base.
- A request to prepare a candidate does not by itself authorize publishing it. Creating a PR does not authorize merging, destructive operations, or unrelated changes; ask before those actions.

## Workflow

1. Identify the target and its contribution requirements. Link a relevant issue when appropriate or required; respect the user's choice of closing or nonclosing reference.
2. Select the base from target metadata and follow the repository's branch convention, or use `type/description` as a nonblocking default when none exists.
3. Implement in work units using the repository's commit convention, or conventional commits as a nonblocking default when none exists; follow the merged ODD applicable test-first policy, run applicable tests, shellcheck on modified scripts, and test changed skills in at least one agent when relevant. The per-task advisory 400 authored-line heuristic is not an automatic split or a reason to omit tests or docs.
4. Prepare the PR body from the target template if present, otherwise use a concise summary and test plan. Open the PR when requested and apply labels only as appropriate to the target.
5. Check target-policy required CI and report pending/failing checks rather than declaring merge-ready.

---

## Branch Naming

When the repository has no branch naming convention, this is a suggested default, not a requirement:

```
^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)\/[a-z0-9._-]+$
```

**Format:** `type/description` — lowercase, no spaces, only `a-z0-9._-` in description.

| Type | Branch pattern | Example |
|------|---------------|---------|
| Feature | `feat/<description>` | `feat/user-login` |
| Bug fix | `fix/<description>` | `fix/zsh-glob-error` |
| Chore | `chore/<description>` | `chore/update-ci-actions` |
| Docs | `docs/<description>` | `docs/installation-guide` |
| Style | `style/<description>` | `style/format-scripts` |
| Refactor | `refactor/<description>` | `refactor/extract-shared-logic` |
| Performance | `perf/<description>` | `perf/reduce-startup-time` |
| Test | `test/<description>` | `test/add-setup-coverage` |
| Build | `build/<description>` | `build/update-shellcheck` |
| CI | `ci/<description>` | `ci/add-branch-validation` |
| Revert | `revert/<description>` | `revert/broken-setup-change` |

---

## PR Body Format

Use the target's PR template when present, filling it from observed evidence and retaining its required sections. Otherwise use a concise description and test plan; the following sections are suggestions, not universal requirements.

### 1. Linked Issue (when applicable)

Use a closing (`Closes #N`, `Fixes #N`, or `Resolves #N`) or nonclosing `Refs #N` reference as appropriate to the user's intent and target policy. Do not turn `Refs` into an automatic close.

### 2. PR Type (when applicable)

If the target template or policy uses these types, select the appropriate one and apply a matching label only when relevant:

| Checkbox | Label to add |
|----------|-------------|
| Bug fix | `type:bug` |
| New feature | `type:feature` |
| Documentation only | `type:docs` |
| Code refactoring | `type:refactor` |
| Maintenance/tooling | `type:chore` |
| Breaking change | `type:breaking-change` |

### 3. Summary

1-3 bullet points of what the PR does.

### 4. Changes Table

```markdown
| File | Change |
|------|--------|
| `path/to/file` | What changed |
```

### 5. Test Plan

Record actual commands and outcomes, including shellcheck on modified scripts, manual testing of affected functionality, and whether changed skills load in at least one agent. Mark inapplicable checks as such; do not invent successful runs.

### 6. Contributor Checklist

Do not mark an unverified `[x]` checkbox. Check template items only after evidence supports them; leave pending items unchecked. If a template demands every box checked, resolve outstanding items before submission rather than falsely attesting.

---

## Labels and Automated Checks

- Follow the target's label policy; do not require a `type:*` label if the target does not use or require one. A commit-type mapping below is a suggestion, not proof of label availability or permission.
- Protected labels require an exact direct instruction naming the label and an actor with MAINTAIN/ADMIN permission. Do not infer authorization from a general request to prepare or open a PR.
- For a PR above the advisory 400 authored-line review budget, follow the destination repository's documented contribution/size policy. `size:exception` is a Gentle-owned repository policy, not a universal label requirement. Never request, create, or add the label for generic users unless their destination policy uses it. Only when that policy uses `size:exception`, record the human-selected `size:exception` rationale if that route was selected; no separate instructor proof is required. Preserve actual policy acceptance gates and apply the protected label only under the same direct-instruction and actor rule. Choosing `single-pr` does not waive policy gates or label authorization, nor automatically select `exception-ok`. Do not code-golf or omit tests to meet the budget.
- REQUIRED CI is determined by target policy, not a fixed list of job names. Check issue-reference validation (including target-supported `Refs`), labels and shellcheck where the target requires them. CodeRabbit is optional unless required by target policy. Report required pending or failing checks; never merge on an unverified green claim.

---

## Conventional Commits

Follow the repository's commit message convention. When none exists, this format is a suggested default, not a requirement:

```
^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z0-9\._-]+\))?!?: .+
```

**Format:** `type(scope): description` or `type: description`

- `type` — required, one of: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`
- `(scope)` — optional, lowercase with `a-z0-9._-`
- `!` — optional, indicates breaking change
- `description` — required, starts after `: `

Type-to-label mapping:

| Commit type | PR label |
|-------------|----------|
| `feat` | `type:feature` |
| `fix` | `type:bug` |
| `docs` | `type:docs` |
| `refactor` | `type:refactor` |
| `chore` | `type:chore` |
| `style` | `type:chore` |
| `perf` | `type:feature` |
| `test` | `type:chore` |
| `build` | `type:chore` |
| `ci` | `type:chore` |
| `revert` | `type:bug` |
| `feat!` / `fix!` | `type:breaking-change` |

Examples:
```
feat(scripts): add Codex support to setup.sh
fix(skills): correct branch name guidance
docs(readme): update multi-model configuration guide
refactor(skills): extract shared persistence logic
chore(ci): add shellcheck to PR validation workflow
perf(scripts): reduce setup.sh execution time
style(skills): fix markdown formatting
test(scripts): add setup.sh integration tests
ci(workflows): add branch name validation
revert: undo broken setup change
feat!: redesign skill loading system
```

---

## Commands

Local target inspection may use `git remote get-url origin`. Verify target metadata and the default branch with target-bound `gh` calls. Run applicable local checks before delivery. A clear request to create a PR authorizes the necessary branch, commit, push and PR creation operations, but not merge or destructive operations. Pass the verified `--repo` and `--base` explicitly, and use an issue reference only when applicable. Do not execute a command block as an automatic workflow.
