#!/usr/bin/env bash
# Prueba las migraciones de supabase/migrations en un Postgres temporal (sin Docker).
# Uso: scripts/db/test.sh
set -euo pipefail
export LC_ALL=C LANG=C
cd "$(dirname "$0")/../.."
DIR="${TMPDIR:-/tmp}/kraft-pg-$$"
PGBIN="$(dirname "$(command -v postgres)")"
trap '"$PGBIN/pg_ctl" -D "$DIR/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DIR"' EXIT

mkdir -p "$DIR"
"$PGBIN/initdb" -D "$DIR/data" -U postgres -A trust --no-locale -E UTF8 >/dev/null
"$PGBIN/pg_ctl" -D "$DIR/data" -l "$DIR/log" -w -o "-c listen_addresses='' -k $DIR -c TimeZone=UTC" start >/dev/null

PSQL=(psql -h "$DIR" -U postgres -v ON_ERROR_STOP=1 -q -X)
"${PSQL[@]}" -d postgres -c 'create database kraft'
"${PSQL[@]}" -d kraft -f scripts/db/supabase-stub.sql
for f in ${MIGRATIONS:-supabase/migrations}/*.sql; do "${PSQL[@]}" -d kraft -f "$f"; done
"${PSQL[@]}" -d kraft -o /dev/null -f scripts/db/tests.sql
echo "✓ base de datos: todos los tests pasan"
