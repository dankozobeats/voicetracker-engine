#!/usr/bin/env bash
set -euo pipefail

VOICE_LABEL="voice-approved"

if [[ -z "${GITHUB_EVENT_PATH:-}" || ! -f "${GITHUB_EVENT_PATH:-}" ]]; then
  echo "[guard-voice] Not running in GitHub Actions (GITHUB_EVENT_PATH missing). Skipping."
  exit 0
fi

is_pr="$(node -e 'const e=require(process.argv[1]); process.stdout.write(String(Boolean(e.pull_request)));' "$GITHUB_EVENT_PATH")"
if [[ "$is_pr" != "true" ]]; then
  echo "[guard-voice] Not a pull_request event. Skipping label-based protection."
  exit 0
fi

base_sha="$(node -e 'const e=require(process.argv[1]); process.stdout.write(e.pull_request.base.sha);' "$GITHUB_EVENT_PATH")"
head_sha="$(node -e 'const e=require(process.argv[1]); process.stdout.write(e.pull_request.head.sha);' "$GITHUB_EVENT_PATH")"
labels_csv="$(node -e 'const e=require(process.argv[1]); process.stdout.write((e.pull_request.labels||[]).map(l=>l.name).join(","));' "$GITHUB_EVENT_PATH")"

if ! git cat-file -e "${base_sha}^{commit}" 2>/dev/null || ! git cat-file -e "${head_sha}^{commit}" 2>/dev/null; then
  echo "[guard-voice] Fetching missing commits for diff..."
  git fetch --no-tags --prune --depth=1 origin "$base_sha" "$head_sha"
fi

changed_voice="$(git diff --name-only "$base_sha" "$head_sha" -- 'src/voice/**' || true)"
if [[ -z "$changed_voice" ]]; then
  echo "[guard-voice] OK: no changes under src/voice/"
  exit 0
fi

if [[ ",${labels_csv}," != *",${VOICE_LABEL},"* ]]; then
  echo "[guard-voice] FAIL: Changes detected under src/voice/ but PR is missing label \"${VOICE_LABEL}\"."
  echo "[guard-voice] Changed files:"
  echo "$changed_voice" | sed 's/^/ - /'
  echo
  echo "[guard-voice] Add label \"${VOICE_LABEL}\" to the PR to acknowledge the protected voice contract."
  exit 1
fi

echo "[guard-voice] OK: protected src/voice/ changes are explicitly approved via label \"${VOICE_LABEL}\"."

