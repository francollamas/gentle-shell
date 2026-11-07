---
name: gentle-ai-rdd-defect-workflow
description: "Trigger: RDD, receipt-driven development, review authority, receipt/lineage, correction/recovery, delivery gate/kill switch, bounded review defects. Guide work."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Load when the frontmatter trigger terms apply to a defect workflow.

This skill guides public collaboration. It does not grant issue approval, label, review, exception, or merge authority.

## Hard Rules

- Review and Judgment Day evidence is review-only. Pi never mints delivery authority: ordinary commit, push, PR, and release always follow repository policy, regardless of RDD mode.
- Do not require an issue before implementation unless repository policy or the user requires one; use an existing relevant issue when appropriate and do not create one solely to enable a PR unless required by policy or requested. Reproduce on the current integration base before implementation. Audit existing PRs for supersession or conflict; stop or narrow stale claims.
- Group by causal authority invariant. Use one PR or explicit chain per independent invariant and rollback boundary, with issues only when relevant or required. Split independent causes; never merge a superseded or conflicting authority line.
- Inventory every operator flow claimed by the issue or PR, including entry, mode, environment, expectation, and negative controls. Require one truthful black-box bench journey per CLI or lifecycle flow, or actual runtime E2E proof when the core bench cannot represent it. Synthetic proxy coverage never proves another runtime.
- Use CodeGraph-first impact mapping, a dedicated worktree, and behavior-first tests. Run source-mutating normalization before candidate freeze.
- Forecast authored changes before edits. The hard limit is 400 additions plus deletions; above it, STOP for a chain or explicit maintainer-approved exception.
- When RDD is enabled, bind review receipts, lineage, correction, and recovery evidence to the exact candidate. Keep bounded review defects in one correction transaction; never treat that evidence as delivery authority.
- Require independent read-only candidate validation before publication. Validation cannot edit source or authority; findings require a new candidate.
- Keep communication humane and evidence-based. Repository labels and workflow metadata are maintainer-owned, never evidence of contributor blame.

## Decision Gates

| Condition | Action |
| --- | --- |
| Any RDD mode | Review evidence remains review-only; ordinary commit, push, PR, and release follow repository policy with no Pi delivery authority. |
| Applicable repository issue requirement or reproduction fails | Wait, stop, or narrow with evidence. |
| Invariant or rollback is independent | Separate issue and authoritative PR line. |
| Core bench fits / does not fit | Bench journey / actual runtime E2E; never proxy. |
| Forecast exceeds 400 lines | Chain or approved exception before edits. |

## Execution Steps

1. Check mode, applicable repository requirements, PR conflicts, and reproduction on the current integration base.
2. Name invariant and rollback; isolate the worktree; CodeGraph-map code, tests, evidence, docs, distribution, and registration.
3. Inventory flows and controls; add failing tests and the smallest correction.
4. Normalize, enforce budget, run tests, and record each flow's exact candidate, command, scenario, and result.
5. Freeze, validate read-only, and give the verdict, evidence, and one humane next action.

## Output Contract

Return `rdd_mode`, `issue_pr` (issue if any, and PR if any), `causal_invariant`, `operator_flows`, `journey_runtime_evidence`, `changed_line_budget`, `tests`, `rollback`, and `unresolved_authority_decisions`.

Identify relevant and superseded/conflicting authority lines; every flow, negative control, and candidate-bound proof; additions plus deletions and chain/exception; test results; independent rollback; and unresolved maintainer decisions.

## References

No supporting files. Current repository policy remains authoritative.
