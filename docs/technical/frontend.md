# Frontend — Technical Reference

## Setup

```
apps/web/
  src/
    components/       ← shared UI (Button, Card, Layout)
    features/         ← feature slices (game/, progression/, …)
    hooks/            ← cross-feature hooks (useLocale, useWords)
    routes/           ← page components registered in React Router
    stores/           ← Zustand stores (settingsStore, progressStore)
    styles/           ← design system (tokens.css, reset.css, global.css)
    i18n/             ← locale JSON files (fi.json, en.json)
    utils/            ← pure helpers (getImageUrl)
    main.tsx          ← Vite entry; mounts <App />
    App.tsx           ← Router setup
  index.html
  vite.config.ts
  tsconfig.json
```

Vite serves on port `5173` in dev. The `/api` path is proxied to Fastify at port `3000` — configured in `vite.config.ts`.

---

## React Router v7

Routes are defined in `App.tsx` using `createBrowserRouter`:

```
/           → Home (routes/Home.tsx)
/game       → Game (features/game/GamePage.tsx)
/settings   → Settings (routes/Settings.tsx)
```

`Layout.tsx` wraps all routes and renders the nav bar. Nav links use `<NavLink>` for active-state styling.

---

## Feature Slices

Feature code lives in `src/features/{feature}/`. Each feature slice is self-contained: its components, hooks, helpers, and types stay inside the slice. Only the route component (the `*Page.tsx`) is registered in the router.

```
src/features/game/
  GamePage.tsx         ← route component
  WordDisplay.tsx
  SyllableSlots.tsx
  SyllableChips.tsx
  SyllableChip.tsx
  DropSlot.tsx
  useGameRound.ts
  selectNextWord.ts
  validateAnswer.ts
  computeXP.ts
  game.module.css
```

Cross-feature utilities go into `src/utils/`. Cross-feature hooks go into `src/hooks/`.

---

## Styling

CSS Modules for all component styles. CSS custom properties from `styles/tokens.css` for all design values (colors, spacing, radii, shadows, transitions).

Rules:
- No inline `style` props.
- No Tailwind.
- No style values hardcoded in JS — always reference a token.
- Class names come from `styles.xxx` imports — never raw strings.

---

## Zustand Stores

Two stores, both using `persist` middleware (localStorage).

### `settingsStore`

```ts
interface SettingsState {
  language: 'fi' | 'en';
  difficulty: 1 | 2 | 3;
  setLanguage: (lang: 'fi' | 'en') => void;
  setDifficulty: (d: 1 | 2 | 3) => void;
}
```

localStorage key: `tavuilu-settings`.

### `progressStore`

```ts
interface ProgressState {
  xp: number;
  level: number;
  completedWordIds: string[];
  addXP: (amount: number) => void;
  markWordCompleted: (id: string) => void;
  reset: () => void;
}
```

localStorage key: `tavuilu-progress`.

Never create a third store without a clear reason. Prefer extending an existing store or using local component state.

---

## `useLocale()` Hook

Returns the full locale string object for the currently selected language. Lives in `src/hooks/useLocale.ts`.

```ts
const t = useLocale();
// t.startGame → "Aloita peli" (in Finnish)
```

All UI strings must go through `useLocale()`. Never hardcode Finnish or English text in a component.

Adding a new string:
1. Add the key to `shared/types.ts` → `Locale` interface.
2. Add the string to `apps/web/src/i18n/fi.json` and `apps/web/src/i18n/en.json`.
3. TypeScript will error at build time if a key is missing from any locale file.

---

## `useWords(lang, difficulty)` Hook

Fetches word list from the API. Lives in `src/hooks/useWords.ts`.

```ts
const { words, loading, error } = useWords(lang, difficulty);
```

Fetches `GET /api/words?lang={lang}&difficulty={difficulty}` using plain `fetch`. Refetches when `lang` or `difficulty` changes. No caching library — a single session fetch is sufficient.

```ts
type UseWordsResult = {
  words: Word[];
  loading: boolean;
  error: string | null;
};
```

`Word` is imported from `@tavuilu/shared`.

---

## `getImageUrl(imageRef)` Utility

Lives in `src/utils/getImageUrl.ts`.

```ts
export function getImageUrl(imageRef: string): string {
  const base = import.meta.env.VITE_IMAGE_BASE_URL ?? 'http://localhost:3000';
  return `${base}/images/words/${imageRef}.png`;
}
```

Always use this function. Never construct image URLs manually.

---

## @dnd-kit

Drag-and-drop uses `@dnd-kit/core`. Key concepts:

- `<DndContext>` wraps the game area and handles all drag events.
- `useDraggable` — applied to each `<SyllableChip>`.
- `useDroppable` — applied to each `<DropSlot>`.
- `DragOverlay` — renders the dragging ghost chip, portaled to document body.

Do not use `@dnd-kit/sortable` for the slot targets — the slots are fixed positions, not sortable items.

Touch support is enabled by default in `@dnd-kit` via `PointerSensor`.

---

## motion (Framer Motion)

Used for all meaningful animations. Import from `motion/react`.

Chip spring config:
```ts
const spring = { type: "spring", stiffness: 400, damping: 30 };
```

Shake keyframes for error state:
```ts
const shakeVariants = {
  error: {
    x: [0, -8, 8, -4, 4, 0],
    transition: { duration: 0.4 }
  }
};
```

Confetti: a burst of 20–30 colored particles (`<motion.div>`) originating from the word image center, animated with random `x`/`y` offsets and opacity fade. Unmounted after the animation completes.

---

## TypeScript Path Aliases

Both apps use `@tavuilu/shared` to import from `shared/`:

```ts
import type { Word } from '@tavuilu/shared';
```

Configured in `tsconfig.json` via `paths`. Never use relative `../../shared/` paths.

---

## Testing

**Unit tests** (Vitest): co-located with the module they test, named `{module}.test.ts`. Run with `pnpm --filter web test`.

**E2E tests** (Playwright): in `apps/web/e2e/`. Run with `pnpm --filter web playwright test`. Chromium only in CI; add Firefox/WebKit locally as desired.

Test files for Phase 2:
- `src/features/game/validateAnswer.test.ts`
- `src/features/game/selectNextWord.test.ts`
- `src/features/game/computeXP.test.ts`
- `e2e/game.spec.ts`
