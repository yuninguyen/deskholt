# Deskholt

Affiliate marketing site built with Next.js — product listings, category pages, affiliate link redirects, and click tracking.

## Tech Stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Database:** Prisma ORM (SQLite in dev via `prisma/dev.db`; `docker-compose.yml` provisions PostgreSQL + Redis for a production-like setup)
- **Cache/Queue:** Redis (`ioredis`)
- **Styling:** Tailwind CSS

## Getting Started

```bash
npm install
cp .env.example .env   # adjust DATABASE_URL / REDIS_URL as needed

# optional: start Postgres + Redis in Docker
docker-compose up -d

npx prisma generate
npm run prisma:push
npm run db:seed        # seed sample products

npm run dev
```

App runs at `http://localhost:3000`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | Lint |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:push` | Push schema to the database |
| `npm run db:seed` | Seed the database |

## Project Structure

```
src/
  app/            # Next.js App Router pages
    category/[slug]/
    products/[slug]/
    go/[slug]/            # affiliate redirect handler
    affiliate-disclosure/
  components/
  lib/            # prisma.ts, redis.ts
  workers/        # clickWorker.ts — click tracking
prisma/
  schema.prisma   # Product, AffiliateLink, Click models
```

## Deployment

1. Run `docker compose up -d` on the VPS to start the PostgreSQL & Redis containers.
2. Build the app with `npm run build` and run it via PM2 (`pm2 start npm --name "deskholt" -- run start`).
3. Configure Nginx as a reverse proxy to port 3000 and enable SSL via Cloudflare.

## Docs

Planning and spec documents live at the repo root (`DESKHOLT_FULL_SPECIFICATION.md`, `Admin_Panel_for_Deskholt.md`, `Create_Post_for_Deskholt.md`, `Email_system_for_Deskholt.md`, `Legal_Content_for_Deskholt.md`, `Stage-0.md`).

## AI Tooling

This repo is set up for AI-assisted development — see [CLAUDE.md](CLAUDE.md) for the active rules (GitNexus code intelligence, spec-kit auto-activation, coding hygiene).
