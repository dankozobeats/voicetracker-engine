#!/usr/bin/env bash
set -euo pipefail

VOICE_API_DIR="app/api/transactions/voice"

if [[ ! -d "$VOICE_API_DIR" ]]; then
  echo "[guard-api-voice] OK: $VOICE_API_DIR does not exist."
  exit 0
fi

files="$(find "$VOICE_API_DIR" -type f -name '*.ts' ! -name '*.spec.ts' -print)"
if [[ -z "$files" ]]; then
  echo "[guard-api-voice] OK: no runtime TS files found under $VOICE_API_DIR."
  exit 0
fi

matches="$(
  grep -RInE "(from ['\\\"]engine/|import\\(['\\\"]engine/)" $files || true
)"

if [[ -n "$matches" ]]; then
  echo "[guard-api-voice] FAIL: Engine imports are forbidden in $VOICE_API_DIR."
  echo "[guard-api-voice] Detected:"
  echo "$matches" | sed 's/^/ - /'
  echo
  echo "[guard-api-voice] Remove the engine import. The voice API endpoint must be insert-only."
  exit 1
fi

echo "[guard-api-voice] OK: no engine imports detected in $VOICE_API_DIR."

