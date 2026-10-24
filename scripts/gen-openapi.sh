#!/usr/bin/env bash
# Regenerate openapi/openapi.json from the FastAPI backend (no database needed).
#   BACKEND_DIR=../drs-backend pnpm api:spec
set -euo pipefail
BACKEND_DIR="${BACKEND_DIR:-../drs-backend}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/openapi/openapi.json"
if [ ! -f "$BACKEND_DIR/app/main.py" ]; then
  echo "drs-backend not found at $BACKEND_DIR (set BACKEND_DIR)" >&2
  exit 1
fi
cd "$BACKEND_DIR"
uv run python -c "
import json, sys
from app.main import app
json.dump(app.openapi(), open(sys.argv[1], 'w'), indent=2)
" "$OUT"
echo "wrote $OUT"
