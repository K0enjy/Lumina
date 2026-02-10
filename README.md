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

- [Bun](https://bun.sh) v1.2 or later

### Install

```bash
bun install
```

### Database Setup

Generate and run migrations:

```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
```

### Run

Start the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Deployment

Build and start the container:

```bash
docker compose up
```

To run in detached mode:

```bash
docker compose up -d
```

## Commands

| Command | Description |
|---|---|
| `bun install` | Install dependencies |
| `bun run dev` | Start dev server with Turbopack |
| `bun run build` | Production build |
| `bun run lint` | Run linter |
| `bun test` | Run unit tests |
| `bunx drizzle-kit generate` | Generate database migrations |
| `bunx drizzle-kit migrate` | Run database migrations |
| `docker compose up` | Start with Docker |

## Project Structure

```
lumina/
├── app/                   # Next.js App Router pages
│   ├── layout.tsx         # Root layout (sidebar, theme provider)
│   ├── page.tsx           # Today dashboard
│   ├── notes/             # Notes list and editor pages
│   └── globals.css        # Tailwind + theme tokens
├── components/
│   ├── ui/                # Shared UI components (Button, Card, Input, Badge)
│   ├── tasks/             # Task management components
│   ├── notes/             # Note display components
│   ├── editor/            # Tiptap editor wrapper
│   ├── search/            # Command palette
│   └── zen/               # Zen mode and audio player
├── lib/
│   ├── actions/           # Server Actions (tasks, notes, search)
│   ├── db/                # Database connection
│   └── utils.ts           # Shared utilities
├── db/
│   └── schema.ts          # Drizzle ORM schema
├── drizzle/               # Generated migrations
├── public/                # Static assets (audio, icons)
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Contributing

Contributions are welcome. Please open an issue to discuss proposed changes before submitting a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
