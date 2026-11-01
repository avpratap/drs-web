#!/usr/bin/env bash
# Regenerate openapi/openapi.json, either from the FastAPI backend source (no database needed)
#   BACKEND_DIR=../drs-backend pnpm api:spec
# or from a running backend's published spec
#   OPENAPI_URL=https://drs-backend-zvb1.onrender.com/openapi.json pnpm api:spec
set -euo pipefail
OUT="$(cd "$(dirname "$0")/.." && pwd)/openapi/openapi.json"
if [ -n "${OPENAPI_URL:-}" ]; then
  tmp="$(mktemp)"
  curl -fsSL --retry 3 "$OPENAPI_URL" -o "$tmp"
  python3 -c "
import json, sys
spec = json.load(open(sys.argv[1]))
assert 'paths' in spec, 'not an OpenAPI document'
json.dump(spec, open(sys.argv[2], 'w'), indent=2, ensure_ascii=False)
open(sys.argv[2], 'a').write('\n')
" "$tmp" "$OUT"
  rm -f "$tmp"
  echo "wrote $OUT from $OPENAPI_URL"
  exit 0
fi
BACKEND_DIR="${BACKEND_DIR:-../drs-backend}"
if [ ! -f "$BACKEND_DIR/app/main.py" ]; then
  echo "drs-backend not found at $BACKEND_DIR (set BACKEND_DIR, or OPENAPI_URL to fetch a live spec)" >&2
  exit 1
fi
cd "$BACKEND_DIR"
uv run python -c "
import json, sys
from app.main import app
json.dump(app.openapi(), open(sys.argv[1], 'w'), indent=2)
" "$OUT"
echo "wrote $OUT"
