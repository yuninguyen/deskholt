# ⚡ Deskholt: Workspace Affiliate Hub

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

Deskholt is a workspace-focused affiliate hub for home-office, desk-setup, and ergonomic products. It provides product and category pages, affiliate-link redirects, and an internal click-tracking engine.

## Tech Stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Database:** Prisma ORM with SQLite for development; PostgreSQL is planned for production
- **Cache/Queue:** Redis with `ioredis`
- **Styling:** Tailwind CSS
- **Infrastructure:** Docker, Nginx, and Cloudflare

## Getting Started

```bash
npm install
cp .env.example .env

npm run prisma:generate
npm run prisma:push
npm run db:seed
npm run dev
```

The development app runs at `http://localhost:3000`.

To start the optional PostgreSQL and Redis services:

```bash
docker compose up -d
```

## Quality Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build

# Run the complete quality gate
npm run check
```

## Project Structure

```text
src/
  app/
    category/[slug]/
    products/[slug]/
    go/[slug]/
    affiliate-disclosure/
  components/
  lib/
  workers/
prisma/
  schema.prisma
  seed.ts
tests/
```

## Deployment Outline

1. Provision PostgreSQL and Redis.
2. Configure environment secrets, including `CLICK_HASH_SALT`.
3. Apply the production Prisma migrations.
4. Run `npm run check` and build the application.
5. Serve Next.js through PM2 and Nginx, with SSL and DNS managed by Cloudflare.

## Documentation

- Implementation history: [`docs/implementation-log-2026-08-12.md`](docs/implementation-log-2026-08-12.md)
- Product and architecture specification: [`DESKHOLT_FULL_SPECIFICATION.md`](DESKHOLT_FULL_SPECIFICATION.md)
- Infrastructure roadmap: [`Stage-0.md`](Stage-0.md)
- Admin design: [`Admin_Panel_for_Deskholt.md`](Admin_Panel_for_Deskholt.md)
- Content creation: [`Create_Post_for_Deskholt.md`](Create_Post_for_Deskholt.md)
- Email system: [`Email_system_for_Deskholt.md`](Email_system_for_Deskholt.md)
- Legal content: [`Legal_Content_for_Deskholt.md`](Legal_Content_for_Deskholt.md)
