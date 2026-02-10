# Lumina

**A self-hosted productivity web app combining task management with note-taking.**

<!-- TODO: Add badges here (e.g., build status, license, version) -->

<!--
  ## Screenshots

  Add screenshots or GIFs showcasing Lumina's interface below.
  Recommended sizes: 1280x720 for full-page screenshots, 800x600 for feature highlights.

  ### Dashboard
  ![Lumina Dashboard](screenshots/dashboard.png)

  ### Note Editor
  ![Note Editor](screenshots/editor.png)

  ### Zen Mode
  ![Zen Mode](screenshots/zen-mode.png)

  ### Dark Mode
  ![Dark Mode](screenshots/dark-mode.png)
-->

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Docker Deployment](#docker-deployment)
- [Commands](#commands)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Task Management with Priorities** — Create, organize, and track tasks with a three-tier priority system (low, medium, high). Mark tasks complete from the Today dashboard.
- **Rich-Text Note-Taking** — Write and edit notes with a Tiptap-powered editor supporting Markdown syntax, tables, task lists, and more.
- **Zen Mode with Ambient Audio** — Focus with a distraction-free writing environment paired with ambient soundscapes.
- **Command Palette Search** — Quickly find tasks and notes with a keyboard-driven command palette (`Ctrl+K`).
- **Dark / Light Theme** — Switch between dark and light themes with a class-based toggle that respects your preference.
- **PWA Support** — Install Lumina as a Progressive Web App for a native-like experience on desktop and mobile.
- **Docker Deployment** — Deploy with a single `docker compose up` command using the included Dockerfile and Compose configuration.

## Tech Stack

| Technology | Version | Role |
|---|---|---|
| [Bun](https://bun.sh) | v1.2+ | JavaScript runtime and package manager |
| [Next.js](https://nextjs.org) | 16 | React framework with App Router |
| [React](https://react.dev) | 19 | UI library (Server + Client Components) |
| [SQLite](https://sqlite.org) | embedded | Database (via `bun:sqlite`) |
| [Drizzle ORM](https://orm.drizzle.team) | 0.44+ | Type-safe SQL query builder |
| [Tailwind CSS](https://tailwindcss.com) | v4 | Utility-first CSS framework |
| [Framer Motion](https://motion.dev) | 12+ | Animation library (`motion` package) |
| [Tiptap](https://tiptap.dev) | 3 | Rich-text / Markdown editor |
| [Docker](https://docker.com) | — | Containerized deployment (`oven/bun:alpine`) |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.2 or later — JavaScript runtime and package manager
- [Node.js](https://nodejs.org) 22 or later — required for Next.js compatibility

### Clone the Repository

```bash
git clone https://github.com/your-username/lumina.git
cd lumina
```

### Install Dependencies

```bash
bun install
```

### Database Setup

Lumina uses SQLite via Drizzle ORM. Generate the migration files from the schema, then apply them to create the database:

```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
```

This creates a local SQLite database file. No external database server is needed.

### Start the Dev Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The development server supports hot reloading — changes to your code will reflect immediately.

## Docker Deployment

Lumina includes a multi-stage Dockerfile built on `oven/bun:alpine` for a minimal production image.

### Quick Start

Build and start the container:

```bash
docker compose up
```

To run in detached mode (background):

```bash
docker compose up -d
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Data Persistence

SQLite data is persisted via a Docker volume. The `docker-compose.yml` mounts a local `./data` directory to `/app/data` inside the container, so your tasks and notes survive container restarts.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `production` | Node environment |
| `DATABASE_PATH` | `data/db.sqlite` | Path to the SQLite database file |

These are pre-configured in `docker-compose.yml` and typically do not need to be changed.

### Stopping the Container

```bash
docker compose down
```

## Commands

| Command | Description |
|---|---|
| `bun install` | Install dependencies |
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun test` | Run unit tests |
| `bunx drizzle-kit generate` | Generate database migrations from schema |
| `bunx drizzle-kit migrate` | Apply database migrations |
| `docker compose up` | Build and start with Docker |

## Project Structure

```
lumina/
├── app/                          # Next.js App Router pages and layouts
│   ├── layout.tsx                # Root layout (sidebar, theme provider)
│   ├── page.tsx                  # Today dashboard — default landing page
│   ├── notes/
│   │   ├── page.tsx              # Notes list view
│   │   └── [id]/page.tsx         # Individual note editor page
│   ├── globals.css               # Tailwind imports and CSS custom property theme tokens
│   └── manifest.ts               # PWA manifest configuration
├── components/
│   ├── ui/                       # Reusable UI primitives (Button, Card, Input, Badge)
│   ├── tasks/                    # Task management (TaskList, TaskItem, AddTask)
│   ├── notes/                    # Note display components (NoteCard, NoteGrid)
│   ├── editor/                   # Tiptap rich-text editor wrapper (NoteEditor)
│   ├── search/                   # Command palette for keyboard-driven search
│   └── zen/                      # Zen mode UI and ambient audio player
├── lib/
│   ├── actions/                  # Server Actions for mutations (tasks.ts, notes.ts, search.ts)
│   ├── db/                       # Drizzle ORM database connection (index.ts)
│   └── utils.ts                  # Shared utility functions
├── db/
│   └── schema.ts                 # Drizzle ORM schema definitions (tables, columns, types)
├── drizzle/                      # Auto-generated database migration files
├── public/
│   ├── audio/                    # Ambient sound files for Zen mode
│   └── icons/                    # PWA icons and favicons
├── drizzle.config.ts             # Drizzle Kit configuration
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── Dockerfile                    # Multi-stage production build (oven/bun:alpine)
├── docker-compose.yml            # Docker Compose service and volume definitions
└── README.md
```

## Contributing

Contributions are welcome! Whether it's a bug fix, new feature, or documentation improvement, we appreciate your help.

### Getting Started

1. **Fork the repository** and clone your fork locally:

   ```bash
   git clone https://github.com/your-username/lumina.git
   cd lumina
   ```

2. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feat/your-feature-name
   ```

3. **Install dependencies** and set up the database:

   ```bash
   bun install
   bunx drizzle-kit generate
   bunx drizzle-kit migrate
   ```

4. **Make your changes**, following the coding conventions below.

5. **Run tests** to make sure everything passes:

   ```bash
   bun test
   ```

6. **Commit your changes** with a clear, descriptive message and **open a pull request** against `main`.

### Coding Conventions

Lumina follows strict conventions to keep the codebase consistent. See `CLAUDE.md` for the full specification. Key points:

- **Server Components by default** — Only add `'use client'` when a component needs state, effects, event handlers, or browser APIs.
- **Server Actions for all mutations** — Data mutations go through Server Actions in `lib/actions/`, not API routes. Validate inputs with Zod and call `revalidatePath()` after writes.
- **Strict TypeScript** — No `any` types. Use `type` over `interface` unless extending. Use the `@/` path alias for imports.
- **Tailwind-only styling** — Use Tailwind CSS utility classes exclusively. No inline styles, no additional CSS libraries.
- **Drizzle ORM for database access** — All queries use the Drizzle query builder through `lib/db/`. Never import `bun:sqlite` directly outside of `lib/db/`.

### Pull Request Guidelines

- Keep PRs focused on a single change — avoid mixing unrelated modifications.
- Describe what your PR does and why in the description.
- Ensure `bun test` passes before submitting.
- If your change affects the UI, include a screenshot or brief description of the visual result.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

<!-- TODO: Create a LICENSE file with the full MIT license text -->
