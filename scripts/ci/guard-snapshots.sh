#!/usr/bin/env bash
set -euo pipefail

SNAPSHOT_LABEL="snapshot-approved"

if [[ -z "${GITHUB_EVENT_PATH:-}" || ! -f "${GITHUB_EVENT_PATH:-}" ]]; then
  echo "[guard-snapshots] Not running in GitHub Actions (GITHUB_EVENT_PATH missing). Skipping."
  exit 0
fi

is_pr="$(node -e 'const e=require(process.argv[1]); process.stdout.write(String(Boolean(e.pull_request)));' "$GITHUB_EVENT_PATH")"
if [[ "$is_pr" != "true" ]]; then
  echo "[guard-snapshots] Not a pull_request event. Skipping label-based snapshot protection."
  exit 0
fi

base_sha="$(node -e 'const e=require(process.argv[1]); process.stdout.write(e.pull_request.base.sha);' "$GITHUB_EVENT_PATH")"
head_sha="$(node -e 'const e=require(process.argv[1]); process.stdout.write(e.pull_request.head.sha);' "$GITHUB_EVENT_PATH")"
labels_csv="$(node -e 'const e=require(process.argv[1]); process.stdout.write((e.pull_request.labels||[]).map(l=>l.name).join(","));' "$GITHUB_EVENT_PATH")"

if ! git cat-file -e "${base_sha}^{commit}" 2>/dev/null || ! git cat-file -e "${head_sha}^{commit}" 2>/dev/null; then
  echo "[guard-snapshots] Fetching missing commits for diff..."
  git fetch --no-tags --prune --depth=1 origin "$base_sha" "$head_sha"
fi

added_snaps="$(
  git diff --name-status "$base_sha" "$head_sha" -- '*.snap' \
    | awk '$1=="A"{print $2}' \
    || true
)"

if [[ -z "$added_snaps" ]]; then
  echo "[guard-snapshots] OK: no new .snap files added."
  exit 0
fi

if [[ ",${labels_csv}," != *",${SNAPSHOT_LABEL},"* ]]; then
  echo "[guard-snapshots] FAIL: New snapshot files were added but PR is missing label \"${SNAPSHOT_LABEL}\"."
  echo "[guard-snapshots] New snapshot files:"
  echo "$added_snaps" | sed 's/^/ - /'
  echo
  echo "[guard-snapshots] Prefer semantic assertions. If snapshots are necessary, add label \"${SNAPSHOT_LABEL}\"."
  exit 1
fi

echo "[guard-snapshots] OK: new snapshots are explicitly approved via label \"${SNAPSHOT_LABEL}\"."

