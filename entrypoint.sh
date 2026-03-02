#!/bin/sh
set -e

DB_PATH="${DATABASE_PATH:-data/db.sqlite}"
DB_DIR=$(dirname "$DB_PATH")

# Ensure the data directory exists
mkdir -p "$DB_DIR"

# Migration tracking table
sqlite3 "$DB_PATH" "CREATE TABLE IF NOT EXISTS __drizzle_migrations (name TEXT PRIMARY KEY, applied_at INTEGER);" 2>/dev/null || true

# Seed the marker for the initial migration if DB already has tasks table
# (handles upgrade from before migration tracking was added)
if [ "$(sqlite3 "$DB_PATH" "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='tasks';" 2>/dev/null)" = "1" ]; then
  sqlite3 "$DB_PATH" "INSERT OR IGNORE INTO __drizzle_migrations (name, applied_at) VALUES ('0000_rich_rhodey', strftime('%s','now'));" 2>/dev/null || true
fi

# Run all migrations
echo "Running database migrations..."
for migration in /app/drizzle/*.sql; do
  if [ -f "$migration" ]; then
    migration_name=$(basename "$migration" .sql)

    applied=$(sqlite3 "$DB_PATH" "SELECT count(*) FROM __drizzle_migrations WHERE name='$migration_name';" 2>/dev/null || echo "0")

    if [ "$applied" = "0" ]; then
      echo "Applying migration: $migration_name"
      sed 's/--> statement-breakpoint//' "$migration" | sqlite3 "$DB_PATH"
      sqlite3 "$DB_PATH" "INSERT INTO __drizzle_migrations (name, applied_at) VALUES ('$migration_name', strftime('%s','now'));"
    else
      echo "Migration already applied: $migration_name"
    fi
  fi
done
echo "Migrations complete."

exec bun server.js
