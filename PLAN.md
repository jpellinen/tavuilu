# Tavuilu — Project Plan

## Context

A web app helping Finnish children (ages 4–8) learn to read through colorful mini games. The first (and currently only) mini game is a syllable drag-and-drop puzzle: a word image is shown at the top, syllable chips are scattered below, and the child drags them into the correct order. Players earn XP/points that feed into a progression system — the progression reward mechanic is TBD, so only the data plumbing is laid in. Guest play works via local storage; optional account creation enables cloud sync. Finnish first, multi-lingual architecture from the start. Production-ready and extendable from day one.

---

## Documentation Structure

All specifications live in `docs/`. Each file is scoped narrowly so an AI agent can load only what's relevant. A root `CLAUDE.md` maps common tasks to the right docs.

```
docs/
  overview.md              ← Vision, personas, game loop, feature list
  architecture.md          ← System diagram, tech decisions, ADRs
  features/
    syllable-game.md       ← Syllable drag-drop game full spec
    progression.md         ← XP/points system; reward mechanic TBD
    auth.md                ← Guest vs account flow, sync strategy
    i18n.md                ← Multi-language content system design
  technical/
    frontend.md            ← React/Vite setup, key libraries, patterns
    backend.md             ← API design, Fastify routes, auth tokens
    database.md            ← Postgres schema + local-storage shape
    content-format.md      ← JSON word list spec, image referencing
    docker.md              ← Dev and prod compose setup
    testing.md             ← Testing strategy, coverage expectations
  design/
    visual-style.md        ← Color palette, typography, animation principles
    ux-flows.md            ← Screen flows, game loop diagram
```

`CLAUDE.md` at the project root tells agents which docs to read for which tasks.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Package manager | pnpm | Fast, deterministic |
| Frontend | React 19 + TypeScript + Vite | Fast DX, ecosystem |
| Routing | React Router v7 | Established, simple API |
| Styling | CSS Modules + CSS Custom Properties | Component-scoped styles; design tokens (colors, radii, spacing) via `:root` variables. Zero runtime, Vite-native, no dependencies. |
| Animation / drag | motion + @dnd-kit | Spring physics, particles; dnd-kit for accessible touch drag |
| State | Zustand (two stores) | `settingsStore` (language, difficulty) + `progressStore` (XP, level) — both persisted to localStorage via the `persist` middleware |
| Data fetching | Plain fetch + custom hooks | No extra dependency; straightforward for this app's needs |
| i18n (UI strings) | Locale JSON + `useLocale()` hook | Locale strings are JSON files; selected language lives in `settingsStore` (Zustand). `useLocale()` reads the store and returns the matching strings. No context needed. |
| Linting / formatting | ESLint + Prettier | Code quality and consistent style |
| Backend | Node.js + Fastify + TypeScript | Typed, fast, lightweight |
| Auth | better-auth | Handles JWT, refresh tokens, sessions; Prisma adapter |
| ORM | Prisma | TypeScript-first schema and migrations |
| Database | PostgreSQL | User accounts and cloud progress |
| Containerization | Docker Compose | Dev/prod parity |
| Testing (FE) | Vitest + React Testing Library | Fast, co-located |
| Testing (BE) | Vitest | Consistent toolchain |
| E2E | Playwright | Browser-level game interaction tests |
| CI | GitHub Actions | Lint + type-check + test on every PR |

---

## Architecture Overview

```
┌─────────────────┐      HTTP(S)     ┌──────────────────┐
│  React SPA      │ ◄──────────────► │  Fastify API     │
│  (Vite)         │                  │  (Node.js/TS)    │
│                 │                  │                  │
│  Local Storage  │                  │  PostgreSQL      │
│  (guest mode)   │                  │  (registered)    │
└─────────────────┘                  └──────────────────┘
```

**Guest users**: all state in `localStorage` — progress, settings, XP.  
**Registered users**: state synced to Postgres; local storage is a write-through cache.  
The frontend works 100% offline for guests. Account creation is a soft prompt, never a gate.

---

## Project Structure

Plain folder structure — one repo, no workspace tooling. Shared types imported via TypeScript path aliases.

```
tavuilu/
  apps/
    web/               ← React app (Vite, own package.json)
    api/               ← Fastify backend (own package.json)
      content/
        fi.json        ← Finnish word list (served via API endpoint)
        en.json        ← (future)
        images/
          words/       ← word images co-located with content (served as static files)
  shared/              ← TypeScript types and Zod schemas (no package.json, imported via path alias)
  docs/                ← All spec files
  docker-compose.yml
  docker-compose.prod.yml
  CLAUDE.md
  PLAN.md
```

---

## Content Format

Words are defined in JSON files under `apps/api/content/` (one file per language). The API validates them with Zod schemas from `shared/` on startup and serves them via REST endpoints. The frontend fetches words from the API — it never reads content files directly.

```json
// content/fi.json (example entry)
{
  "id": "kala",
  "word": "kala",
  "syllables": ["ka", "la"],
  "difficulty": 1,
  "imageRef": "kala",
  "tags": ["animals", "water"]
}
```

`imageRef` is a bare stem (`"kala"`), not a URL. The frontend resolves it to a full URL through a single `getImageUrl(imageRef)` utility that reads `VITE_IMAGE_BASE_URL`:

- Default (no CDN): `VITE_IMAGE_BASE_URL=http://localhost:3000` → serves from Fastify via `@fastify/static` at `/images/words/{ref}.png`
- CDN: `VITE_IMAGE_BASE_URL=https://cdn.tavuilu.fi` → no code change, just upload images to CDN and flip the env var

All content — word JSON and images — lives in `apps/api/content/`. Placeholder images used during development; real art drops in without schema changes. Example endpoints: `GET /api/words?lang=fi&difficulty=1`, `GET /images/words/kala.png`.

Difficulty tiers (informed by Finnish syllable complexity):
- **1** — 2-syllable simple CV words (ka-la, au-to, ko-ira) — ages 4–5
- **2** — 3-syllable words — ages 5–7
- **3** — 4+ syllable words — ages 7–8

---

## Progression (Placeholder)

- Every completed round awards XP based on difficulty and speed
- XP accumulates in a typed store (Zustand + localStorage / Postgres)
- Player has a `level` derived from cumulative XP
- What XP and levels *unlock* is TBD — the data model and hook points are scaffolded but the reward UI is not implemented yet
- This keeps the extension surface clean when the reward mechanic is decided

---

## Implementation Phases

Each phase begins by writing the relevant `docs/` files before implementation starts. Docs are written just-in-time, not all upfront.

### Phase 1 — Foundation

*Docs to write first:* `docs/overview.md`, `docs/architecture.md`

1. Scaffold `apps/web` (Vite + React), `apps/api` (Fastify), `shared/` with TypeScript path aliases wired in both apps
2. ESLint + Prettier config; `.env.example` with `VITE_API_URL` and `VITE_IMAGE_BASE_URL`
3. Docker Compose: `web` (Vite dev server with `/api` proxy to Fastify), `api` (Fastify), `db` (Postgres)
4. GitHub Actions CI: lint + type-check + test on push
5. Design system in `apps/web/src/styles/`: `tokens.css` (CSS custom properties for colors, spacing, radii), `reset.css`, `global.css`; base components (Button, Card) with CSS Modules
6. React Router v7: Home, Game, Settings routes (stubs with correct layout)
7. Zustand stores: `settingsStore` (language, difficulty — persisted) + `progressStore` (XP, level — persisted); locale JSON files under `apps/web/src/i18n/`; `useLocale()` hook derives strings from `settingsStore.language`
8. API content loader: parse `apps/api/content/fi.json` on startup using Zod schemas from `shared/`; expose `GET /api/words` endpoint and serve images as static files via `@fastify/static`

### Phase 2 — Syllable Game (production quality)

*Docs to write first:* `docs/features/syllable-game.md`, `docs/features/progression.md`, `docs/technical/frontend.md`, `docs/design/visual-style.md`, `docs/design/ux-flows.md`, `docs/technical/content-format.md`

1. Word + placeholder image display at top
2. Syllable drop-target slots rendered in order
3. Draggable syllable chips in randomized positions below
4. @dnd-kit drag logic: chip snaps into slot; ejects if wrong slot on submit
5. `motion`: confetti particle burst on success, shake animation on error
6. Round flow: display word → player drags → submit → XP awarded → next word
7. Word selection: filtered by player's current difficulty tier
8. Vitest unit tests: syllable validation, word selection logic
9. Playwright E2E: full drag-and-drop round, success + error paths
10. Responsive layout: works on desktop, tablet, and large phone (children often use tablets)
11. Touch-event support verified on simulated mobile in CI

### Phase 3 — Auth + Cloud Sync

*Docs to write first:* `docs/features/auth.md`, `docs/technical/backend.md`, `docs/technical/database.md`

1. Registration / login UI (minimal, child-friendly)
2. `better-auth` + Prisma Postgres schema for users and progress
3. Sync: on login, merge local-storage snapshot with server state
4. Soft prompt after completed rounds: "Create an account to save your progress!"
5. Guest-to-account upgrade flow (no progress lost)

### Phase 4 — Polish + Expansion

*Docs to write first:* `docs/features/i18n.md` (if adding language), feature doc for each new mini game

1. Word image pipeline (AI-generated or illustrated, batch review workflow)
2. Sound design (Web Audio API, CC0 cheerful sounds)
3. Second mini game (TBD — reading comprehension, letter matching, etc.)
4. Additional languages (content file + locale strings only, no code change)
5. Progressive Web App (offline capability, installable)

---

## Verification Plan

**After Phase 1:**
- `docker compose up` starts all three services with no errors
- `localhost:5173` shows home screen with correct design token colors applied
- `apps/web` type-checks and tests pass in CI
- Content loader correctly parses and validates `fi.json`

**After Phase 2:**
- Playwright: drag syllables to correct slots → success particle burst fires
- Playwright: submit wrong order → shake animation, no XP awarded
- Vitest: syllable validator returns correct pass/fail for edge cases
- Manual: test on tablet (touch drag works)

**After Phase 3:**
- E2E: register → play → refresh → progress retained server-side
- E2E: guest play → register → XP from local session merged to account

---

## Open Questions / To Revisit

- **Images**: test DALL-E 3 vs Flux for style consistency; may need style-transfer post-processing
- **Progression reward**: virtual pet, sticker book, unlockable characters — decide before Phase 4
- **Sound effects**: which CC0 library or generate with Elevenlabs/similar
- **Hosting**: not decided; Docker Compose supports self-hosted VPS or any PaaS with containers
