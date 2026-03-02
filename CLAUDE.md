# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lumina is a self-hosted productivity app combining daily task management with rich-text note-taking. Built with Next.js 16 (App Router), React 19, SQLite via Drizzle ORM, and Bun as runtime/package manager.

## Commands

```bash
# Development
bun install                      # Install dependencies
bun run dev                      # Start dev server (Turbopack on localhost:3000)
bun run build                    # Production build
bun run start                    # Start production server
bun run lint                     # Run Next.js linting

# Database
bunx drizzle-kit generate        # Generate migrations from schema
bunx drizzle-kit migrate         # Apply migrations

# Testing
bun test                         # Run unit tests (happy-dom)
bun test __tests__/actions/tasks.test.ts  # Run a single test file
bun run test:e2e                 # Run Playwright E2E tests

# Docker
docker compose up                # Build and run containerized
```

## Architecture

### Data Flow
Server Components (pages) → Server Actions (`lib/actions/`) → Drizzle ORM (`lib/db/`) → SQLite (`data/db.sqlite`)

Client Components use `useOptimistic` + `useTransition` for instant UI feedback, then Server Actions mutate the DB and call `revalidatePath()`.

### Key Directories
- **`app/`** — Next.js App Router pages (Server Components by default)
- **`components/`** — React components split by domain: `ui/`, `tasks/`, `notes/`, `editor/`, `search/`, `zen/`
- **`lib/actions/`** — Server Actions with Zod validation (`tasks.ts`, `notes.ts`, `search.ts`)
- **`lib/db/`** — Drizzle ORM database connection (uses `bun:sqlite`)
- **`db/schema.ts`** — Database schema (tasks + notes tables)
- **`drizzle/`** — Auto-generated SQL migrations
- **`__tests__/`** — Unit tests (Bun test runner + happy-dom)
- **`e2e/`** — Playwright end-to-end tests

### Database Schema
- **tasks**: id, text, status (`todo`/`done`), priority (1-3), date (YYYY-MM-DD), timestamps
- **notes**: id, title, content (HTML), tags (JSON array), timestamps

### Important Patterns
- `'use client'` only when component needs state, effects, event handlers, or browser APIs
- All mutations go through Server Actions in `lib/actions/`, never direct DB access from components
- Zod schemas validate all Server Action inputs
- Path alias `@/` maps to project root for all imports
- Theme system uses CSS custom properties (`--bg`, `--surface`, `--accent`, `--text`, etc.) with `.dark` class toggle
- Tiptap v3 powers the rich-text editor with markdown support, tables, and task lists
- Command palette triggered via `Ctrl+K`

### Environment Variables
- `DATABASE_PATH` (default: `data/db.sqlite`) — SQLite database location
- `NODE_ENV` — `production` or `development`

## Coding Conventions
- Strict TypeScript — no `any`, use `type` over `interface`
- PascalCase for component files, camelCase for utilities
- Tailwind CSS v4 only for styling — no CSS-in-JS or external CSS libraries
- Props typed as `type Props = { ... }`
- Server Actions return `ActionResult<T>` type with success/error handling
- Never use `bun:sqlite` directly outside `lib/db/`
