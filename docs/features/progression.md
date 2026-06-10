# Progression System

## Overview

Every completed round awards XP. XP and completed words are persisted server-side in Postgres, in a `Progress` row tied to the player's account. A level is derived from cumulative XP. What levels *unlock* is TBD — the data model and hook points are scaffolded but the reward UI is not implemented in Phase 2.

There is no localStorage-only guest mode: every visitor gets an anonymous backend account on first load (see `docs/features/auth.md`), so progress is server-backed from round one — including for players who never register.

---

## XP Amounts

XP is awarded on a **correct** submission only. No XP is deducted for errors.

| Difficulty | Base XP | Speed bonus (≤10 s) | Max XP |
|---|---|---|---|
| 1 | 10 | +5 | 15 |
| 2 | 20 | +5 | 25 |
| 3 | 35 | +5 | 40 |

Speed is measured from when the word is displayed to when the correct submission is made. The timer resets on each new word. Speed bonus applies only to first-attempt correct answers (not after an error on the same word).

---

## Level Formula

```ts
function levelFromXP(xp: number): number {
  return Math.floor(xp / 100) + 1;
}
```

Already implemented in `progressStore.ts`. Level starts at 1, increments every 100 XP. There is no cap in Phase 2.

---

## Store Interface

`progressStore` in `apps/web/src/stores/progressStore.ts`:

```ts
interface ProgressState {
  xp: number;
  level: number;
  completedWordIds: string[];
  addXP: (amount: number) => void;
  markWordCompleted: (id: string) => void;
  setProgress: (data: { xp: number; level: number; completedWordIds: string[] }) => void;
  reset: () => void;
}
```

`addXP` internally recomputes `level` via `levelFromXP`. The store is an in-memory reactive cache only — it is **not** persisted to `localStorage`. On load, `useProgressSync` hydrates it from `GET /api/progress`; the server is the single source of truth.

---

## Computing XP for a Round

The game calculates the XP to award and calls `progressStore.addXP(amount)`:

```ts
function computeXP(difficulty: 1 | 2 | 3, durationMs: number, firstAttempt: boolean): number {
  const base = difficulty === 1 ? 10 : difficulty === 2 ? 20 : 35;
  const speedBonus = firstAttempt && durationMs <= 10_000 ? 5 : 0;
  return base + speedBonus;
}
```

This is a pure function — lives in `src/features/syllable-game/computeXP.ts`, unit-tested with Vitest.

The client calls `addXP`/`markWordCompleted` immediately for instant UI feedback (optimistic update), then `POST /api/progress/round`. The API independently recomputes XP from `wordId`, `durationMs`, and `firstAttempt` using its own copy of this formula (`apps/api/src/routes/progress.ts`) — the client-submitted XP total is never trusted or persisted directly. The response is the authoritative `{ xp, level, completedWordIds }`, applied via `setProgress` to reconcile the optimistic value with the server-confirmed one.

---

## Display

Phase 2 shows XP and level in a minimal status bar below the nav or at the bottom of the game screen:

```
Level 3  •  245 XP
```

The display updates immediately after `addXP` is called (Zustand reactivity). No animation on the XP counter in Phase 2 (Phase 4 can add a count-up animation).

---

## What Levels Unlock (TBD)

The reward mechanic is not decided. Options under consideration:

- Virtual pet that grows with XP
- Sticker book with unlockable stickers per word
- Unlockable character skins for a game mascot

Until decided: the data model (`xp`, `level`, `completedWordIds`) is in place and the `progressStore` exposes clean hook points. No reward UI is rendered in Phase 2.

---

## Cloud Sync (Phase 3)

There is no separate "guest" progress and no local/server merge step. Every player — anonymous or registered — already has a `User` and `Progress` row in Postgres from their first visit (see "Anonymous Mode" in `docs/features/auth.md`). `progressStore` is hydrated from `GET /api/progress` via `useProgressSync`, and each round's result is persisted immediately via `POST /api/progress/round`.

Registering (adding email + password) links credentials to the existing anonymous `User` row — the user ID and `Progress` row are unchanged, so there is nothing to migrate or merge. This also closes the cheating vector a localStorage-merge approach would have: the server computes and stores XP itself per round, so a client can never inflate its own total by submitting a crafted "local" snapshot.
