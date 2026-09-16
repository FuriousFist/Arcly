# Arcly

AI-powered teaching platform. Instructors create classes, set assignments, and get AI-assisted grading. Students join via invite code and submit work.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Database / Auth:** Supabase (Postgres + RLS + Google OAuth)
- **Styling:** Tailwind CSS 4
- **AI:** Claude API via Anthropic SDK (server-side only)

## Getting started

```bash
npm install
npm run dev
```

Requires Node 22 (see `.nvmrc`). Run `nvm use` before starting.

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser-safe) |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-only) |

Copy `.env.local.example` to `.env.local` and fill in the values.

## Database migrations

Migrations live in `supabase/migrations/`. To apply locally:

```bash
pnpm supabase db push
```

## Vault docs

Project notes, tickets, and dev logs live in `../vault/`. Start at `../vault/MOC.md`.
