# Tavuilu — Architecture

## System Diagram

```
┌──────────────────────────────────┐        HTTP(S)       ┌──────────────────────────────┐
│  React SPA (Vite)                │ ◄──────────────────► │  Fastify API (Node.js/TS)    │
│                                  │                       │                              │
│  Guest state → localStorage      │                       │  PostgreSQL                  │
│  Auth state  → localStorage      │                       │  (registered users only)     │
│  (write-through cache)           │                       │                              │
└──────────────────────────────────┘                       └──────────────────────────────┘
```

**Guest users:** All state lives in `localStorage` via Zustand's `persist` middleware. The app works fully offline for guests.

**Registered users:** State is synced to Postgres. `localStorage` acts as a write-through cache — reads are local, writes go to both local and API.

The frontend **never** reads content files directly. It fetches words from `GET /api/words` and images via static URLs served by Fastify.

---

## Project Structure

```
tavuilu/
  apps/
    web/                    ← React SPA (Vite, own package.json)
      src/
        components/         ← Shared UI components (Button, Card, …)
        features/           ← Feature slices (game/, progression/, auth/, …)
        hooks/              ← Custom hooks (useLocale, useWords, …)
        routes/             ← Page components wired to React Router
        stores/             ← Zustand stores (settingsStore, progressStore)
        styles/             ← Design system (tokens.css, reset.css, global.css)
        i18n/               ← Locale JSON files (fi.json, …)
        utils/              ← Pure helpers (getImageUrl, …)
    api/                    ← Fastify backend (own package.json)
      src/
        routes/             ← Fastify route handlers
        plugins/            ← Fastify plugins (empty — scaffolded for Phase 2+)
        schemas/            ← Zod validation schemas
        content-loader.ts   ← Parses fi.json at startup
      content/
        fi.json             ← Finnish word list
        images/
          words/            ← Word images (served as static files)
  shared/                   ← TypeScript types (no package.json)
    index.ts                ← Re-exports all public types
    types.ts                ← Shared domain types (Word, UserProgress, Locale)
  docs/                     ← All spec files (this directory)
  docker-compose.yml        ← Dev compose
  CLAUDE.md                 ← Agent task → doc mapping
  PLAN.md                   ← Phase plan and implementation notes
```

`shared/` has no `package.json`. Both `apps/web` and `apps/api` import from it via TypeScript path aliases (`@tavuilu/shared`).

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Package manager | pnpm | Fast, deterministic, disk-efficient |
| Frontend | React 19 + TypeScript + Vite | Fast DX, great ecosystem |
| Routing | React Router v7 | Established, simple nested route API |
| Styling | CSS Modules + CSS Custom Properties | Component-scoped; design tokens via `:root` variables; zero runtime, no deps |
| Animation / drag | motion + @dnd-kit | Spring physics + particle effects; dnd-kit for accessible touch drag |
| State | Zustand | Two stores (`settingsStore`, `progressStore`), both persisted via `persist` middleware |
| Data fetching | Plain `fetch` + custom hooks | No extra dependency; straightforward for this app's data shapes |
| i18n | Locale JSON + `useLocale()` hook | Selected language lives in `settingsStore`; `useLocale()` returns matching strings. No context or heavy library needed. |
| Linting / formatting | ESLint + Prettier | Code quality and consistent style |
| Backend | Fastify + Node.js + TypeScript | Typed, fast, lightweight; good plugin model |
| Auth | better-auth | Handles JWT, refresh, sessions out of the box; has a Prisma adapter |
| ORM | Prisma | TypeScript-first schema and migrations |
| Database | PostgreSQL | Relational; fits user + progress data well |
| Containerization | Docker Compose | Dev/prod parity without Kubernetes overhead |
| Testing (FE) | Vitest + React Testing Library | Fast, co-located unit tests |
| Testing (BE) | Vitest | Consistent toolchain |
| E2E | Playwright | Browser-level drag-and-drop tests; simulated touch in CI |
| CI | GitHub Actions | Lint + type-check + test on every PR |

---

## Architecture Decision Records

### ADR-001: No monorepo tooling (Turborepo / Nx)

**Decision:** Plain folder structure. `apps/web` and `apps/api` each have their own `package.json`. `shared/` is imported via TypeScript path alias, not as a published workspace package.

**Reasoning:** This project has exactly two apps that share a small `types.ts` and `schemas.ts`. The overhead of configuring Turborepo task pipelines, understanding its caching model, and debugging cross-package TypeScript issues outweighs the benefit at this scale. Keeping it plain means any contributor can understand the repo structure in minutes.

**If this changes:** If we add a third app (e.g. an admin dashboard) or the shared layer grows substantially, migrating to pnpm workspaces is low-effort — `shared/` just needs a `package.json`.

---

### ADR-002: CSS Modules + CSS Custom Properties, no Tailwind

**Decision:** Component styles live in `.module.css` files. Design tokens (colors, spacing, radii, shadows) are defined as CSS custom properties in `styles/tokens.css` and applied globally via `:root`.

**Reasoning:** This app has a fixed, hand-crafted visual identity. Tailwind's utility-first model adds value when design is ad hoc; here we want a small, intentional token set enforced by the component stylesheet, not scattered across JSX classname strings. CSS Modules co-locate styles with components without a runtime and integrate natively with Vite.

---

### ADR-003: Plain fetch, no TanStack Query

**Decision:** Data fetching uses plain `fetch` inside custom hooks (`useWords`, etc.). No query cache library.

**Reasoning:** The app fetches word lists (infrequent, small payload) and optionally syncs progress (on session events, not continuously). TanStack Query's cache invalidation model would add conceptual overhead for a use-case that is essentially "load once per session, refetch on language change."

**If this changes:** If we add admin tooling, real-time leaderboards, or complex background sync, adopt TanStack Query then.

---

### ADR-004: Zustand over Redux / Context

**Decision:** Two Zustand stores, both using the `persist` middleware.

**Reasoning:** `settingsStore` and `progressStore` are independent slices. Zustand's flat API avoids boilerplate and makes the persistence integration trivial. Redux would be over-engineered. React Context would require manual serialization for localStorage persistence and risks re-render cascades on XP updates during a fast game loop.

---

### ADR-005: Content co-located with API, served as static files

**Decision:** Word JSON and images live in `apps/api/content/`. Images are served by Fastify via `@fastify/static`. The frontend resolves image URLs through `getImageUrl(imageRef)` using `VITE_IMAGE_BASE_URL`.

**Reasoning:** Keeping content with the API keeps the deployment unit self-contained — one Docker image holds both the server and all content. The `VITE_IMAGE_BASE_URL` indirection means switching to a CDN requires zero code changes: just upload files and flip the env var.

---

### ADR-006: better-auth for authentication

**Decision:** Use `better-auth` with its Prisma adapter.

**Reasoning:** Implements the full session/JWT/refresh-token lifecycle without us owning that security surface. Has TypeScript types throughout. The Prisma adapter generates the required tables in the same migration workflow we already use. Rolling our own auth for a children's app that stores user progress is unnecessary risk.

---

## Environment Variables

### `apps/web` (prefix: `VITE_`)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Base URL for Fastify API calls |
| `VITE_IMAGE_BASE_URL` | `http://localhost:3000` | Resolved by `getImageUrl(ref)` → `{base}/images/words/{ref}.svg` |

### `apps/api`

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | prod only | Postgres connection string |
| `BETTER_AUTH_SECRET` | prod only | Secret for signing sessions |
| `PORT` | default 3000 | Fastify listen port |

Each app has its own `.env.example` (`apps/web/.env.example`, `apps/api/.env.example`) with safe defaults for local dev.

---

## UI Localization

UI strings and game content are two separate localization layers.

**UI strings** are static labels — button text, headings, error messages, settings labels. They live in locale JSON files under `apps/web/src/i18n/`, one file per language:

```
apps/web/src/i18n/
  fi.json   ← Finnish (primary)
  en.json   ← English (future)
```

Each file is a flat key/value map typed against a shared `Locale` interface in `shared/types.ts`. All locale files must implement the same keys — TypeScript enforces this at build time.

```jsonc
// apps/web/src/i18n/fi.json
{
  "startGame": "Aloita peli",
  "settings": "Asetukset",
  "checkAnswer": "Tarkista",
  "correct": "Oikein!",
  "tryAgain": "Yritä uudelleen",
  "difficulty": "Vaikeustaso",
  "language": "Kieli"
}
```

`useLocale()` reads `settingsStore.language`, imports the matching JSON, and returns the strings. Components never reference a language code directly:

```ts
// usage in a component
const t = useLocale();
<button>{t.startGame}</button>
```

Switching language updates `settingsStore.language` (persisted to `localStorage`). Because `useLocale()` reads from the store, all subscribed components re-render automatically — no reload needed.

**Game content** (word lists, syllables, image refs) is separate: it lives in `apps/api/content/{lang}.json`, is served by the API, and is fetched by `useWords(lang, difficulty)`. Adding a language means adding both a locale JSON file (UI strings) and a content JSON file (word list).

---

## Data Flow: Word Round

```
1. App boots → progressStore hydrates from localStorage
2. Game route mounts → useWords(lang, difficulty) fetches GET /api/words?lang=fi&difficulty=1
3. API reads fi.json (parsed+validated at startup) → returns filtered JSON array
4. Frontend picks a random word from the list
5. Word image: <img src={getImageUrl(word.imageRef)} />  →  GET /images/words/kala.svg
6. Player completes round → progressStore.addXP(amount) → localStorage updated
7. (If registered) progressStore calls PATCH /api/progress → Postgres updated
```

---

## CI Pipeline (GitHub Actions)

On every push and pull request:

1. `pnpm install`
2. `pnpm --filter web type-check` + `pnpm --filter api type-check`
3. `pnpm --filter web lint` + `pnpm --filter api lint`
4. `pnpm --filter web test` + `pnpm --filter api test`
5. `pnpm --filter web playwright test` (Playwright with Chromium)

All steps must pass for a PR to merge. No deployment from CI until Phase 3 hosting is decided.
