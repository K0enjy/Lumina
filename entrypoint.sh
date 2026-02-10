#!/bin/sh
set -e

DB_PATH="${DATABASE_PATH:-data/db.sqlite}"
DB_DIR=$(dirname "$DB_PATH")

# Ensure the data directory exists
mkdir -p "$DB_DIR"

# Run migrations if the database doesn't have tables yet
if [ ! -f "$DB_PATH" ] || [ "$(sqlite3 "$DB_PATH" "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='tasks';" 2>/dev/null)" = "0" ]; then
  echo "Running database migrations..."
  # Split on statement-breakpoint and execute each statement
  sed 's/--> statement-breakpoint//' /app/drizzle/0000_rich_rhodey.sql | sqlite3 "$DB_PATH"
  echo "Migrations complete."
fi

exec bun server.js
