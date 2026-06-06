# Tavuilu — Agent Guide

## What is this project?

A web app helping Finnish children ages 4–8 learn to read through mini games. Start with `docs/overview.md` if you need product context, `docs/architecture.md` for technical decisions and structure.

The full phase plan is in `PLAN.md`.

---

## Task → Docs map

Read only what's relevant to your task. Don't load docs speculatively.

| Task | Read first |
|---|---|
| Understanding the product, personas, game loop | `docs/overview.md` |
| Tech stack decisions, project structure, ADRs | `docs/architecture.md` |
| Environment variables, Docker setup | `docs/architecture.md` → Environment Variables section |
| UI string localization, `useLocale()`, locale JSON files | `docs/architecture.md` → UI Localization section |
| Zustand stores, state shape | `docs/architecture.md` → Tech Stack + ADR-004 |
| Image URL resolution, `getImageUrl` | `docs/architecture.md` → ADR-005 + Data Flow section |
| Syllable game mechanics, drag-and-drop spec | `docs/features/syllable-game.md` *(written before Phase 2)* |
| XP/progression system | `docs/features/progression.md` *(written before Phase 2)* |
| Auth flow, guest vs. account | `docs/features/auth.md` *(written before Phase 3)* |
| Postgres schema, Prisma models | `docs/technical/database.md` *(written before Phase 3)* |
| Fastify routes, API design | `docs/technical/backend.md` *(written before Phase 3)* |
| React component patterns, hook conventions | `docs/technical/frontend.md` *(written before Phase 2)* |
| Word list JSON format, content validation | `docs/technical/content-format.md` *(written before Phase 2)* |
| Docker Compose dev/prod setup | `docs/technical/docker.md` *(written before Phase 2)* |
| Testing strategy, coverage expectations | `docs/technical/testing.md` *(written before Phase 2)* |
| Color palette, typography, animation principles | `docs/design/visual-style.md` *(written before Phase 2)* |
| Screen flows, game loop diagram | `docs/design/ux-flows.md` *(written before Phase 2)* |
| Multi-language content system | `docs/features/i18n.md` *(written before Phase 4)* |

---

## Project structure (quick reference)

```
apps/web/src/
  components/     shared UI (Button, Card, …)
  features/       feature slices (game/, progression/, auth/, …)
  hooks/          custom hooks (useLocale, useWords, …)
  routes/         page components
  stores/         Zustand stores (settingsStore, progressStore)
  styles/         design system (tokens.css, reset.css, global.css)
  i18n/           locale JSON files (fi.json, …)
  utils/          pure helpers (getImageUrl, …)

apps/api/src/
  routes/         Fastify route handlers
  plugins/        Fastify plugins
  schemas/        Zod (re-exports from shared/)

apps/api/content/
  fi.json         Finnish word list
  images/words/   word images (served as static files)

shared/
  types.ts        shared domain types
  schemas.ts      Zod schemas
```

---

## Key conventions

- **Path alias:** both apps import shared types via `@tavuilu/shared` — never with relative `../../shared/` paths.
- **Image URLs:** always resolve via `getImageUrl(imageRef)` in `apps/web/src/utils/` — never construct URLs manually.
- **UI strings:** always go through `useLocale()` — never hardcode Finnish or English text in components.
- **State:** use `settingsStore` for language/difficulty, `progressStore` for XP/level. Don't create new stores without a clear reason.
- **Styling:** CSS Modules for component styles, CSS custom properties from `tokens.css` for all design values — no inline styles, no Tailwind.
- **No direct content file reads from the frontend** — all word data comes from `GET /api/words`.
