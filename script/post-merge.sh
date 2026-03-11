#!/bin/bash
set -e

npm install --prefer-offline --no-audit --no-fund 2>/dev/null || npm install

if [ -n "$DATABASE_URL" ]; then
  psql "$DATABASE_URL" -c "ALTER TABLE global_assumptions ADD COLUMN IF NOT EXISTS last_full_research_refresh TIMESTAMP;" 2>/dev/null || true
fi
