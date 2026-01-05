# Quality Gate (CI)

This repository enforces a CI quality gate to prevent regressions in:

- the protected voice module (`src/voice/*`)
- the voice → API endpoint (`app/api/transactions/voice`)
- the test suite stability (snapshot creep)

CI is the merge blocker: if CI fails, the PR must not be merged.

## Pipeline

CI runs:

1. `pnpm install --frozen-lockfile`
2. `pnpm test`
3. Guard scripts:
   - `scripts/ci/guard-voice.sh`
   - `scripts/ci/guard-api-voice.sh`
   - `scripts/ci/guard-snapshots.sh`

## Guards

### Guard 1 — Voice Protection

**Goal:** prevent accidental modifications to the protected voice contract.

- If a PR changes any file under `src/voice/**`
- and the PR does **not** have label `voice-approved`
- CI fails with an explicit message listing the changed files.

**How to override:** add label `voice-approved` to the PR.

### Guard 2 — API Voice Anti-Engine

**Goal:** guarantee that the voice API endpoint remains insert-only and never couples to the engine.

- Scans runtime files under `app/api/transactions/voice/**`
- If an import from `engine/*` is detected
- CI fails with an explicit message showing the offending lines.

There is no label override for this guard.

### Guard 3 — Snapshot Guard

**Goal:** prevent reintroducing fragile snapshot tests by default.

- If a PR adds new `*.snap` files
- and the PR does **not** have label `snapshot-approved`
- CI fails with an explicit message listing the new snapshot files.

**How to override:** add label `snapshot-approved` to the PR (use sparingly).

## Notes

- Guards are PR-aware: label checks only run for `pull_request` events.
- Guards aim to be deterministic and minimize false positives by relying on git diff + explicit patterns.

