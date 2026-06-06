# Progression System

## Overview

Every completed round awards XP. XP accumulates in `progressStore` (Zustand + localStorage). A level is derived from cumulative XP. What levels *unlock* is TBD — the data model and hook points are scaffolded but the reward UI is not implemented in Phase 2.

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
  reset: () => void;
}
```

`addXP` internally recomputes `level` via `levelFromXP`. Both `xp` and `level` are persisted to `localStorage` via Zustand's `persist` middleware under the key `tavuilu-progress`.

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

This is a pure function — lives in `src/features/game/computeXP.ts`, unit-tested with Vitest.

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

Guest users: `progressStore` is localStorage-only. No server calls.

Registered users (Phase 3): on `addXP` and `markWordCompleted`, store also calls `PATCH /api/progress` to sync to Postgres. The local store remains the source of truth for reads; server is the backup. Merge strategy on login: take the higher `xp` value, union of `completedWordIds`.
