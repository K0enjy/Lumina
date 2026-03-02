#!/bin/sh
set -e

DB_PATH="${DATABASE_PATH:-data/db.sqlite}"
DB_DIR=$(dirname "$DB_PATH")

# Ensure the data directory exists
mkdir -p "$DB_DIR"

# Run all migrations
echo "Running database migrations..."
for migration in /app/drizzle/*.sql; do
  if [ -f "$migration" ]; then
    # Extract a table name from migration to check if already applied
    # We use the filename as a simple idempotency check
    migration_name=$(basename "$migration" .sql)
    marker_table="__drizzle_migrations"

    # Create marker table if not exists
    sqlite3 "$DB_PATH" "CREATE TABLE IF NOT EXISTS $marker_table (name TEXT PRIMARY KEY, applied_at INTEGER);" 2>/dev/null || true

    # Check if this migration was already applied
    applied=$(sqlite3 "$DB_PATH" "SELECT count(*) FROM $marker_table WHERE name='$migration_name';" 2>/dev/null || echo "0")

    if [ "$applied" = "0" ]; then
      echo "Applying migration: $migration_name"
      sed 's/--> statement-breakpoint//' "$migration" | sqlite3 "$DB_PATH"
      sqlite3 "$DB_PATH" "INSERT INTO $marker_table (name, applied_at) VALUES ('$migration_name', strftime('%s','now'));"
    fi
  fi
done
echo "Migrations complete."

exec bun server.js
