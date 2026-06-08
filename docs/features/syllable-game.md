# Syllable Game — Full Specification

## Overview

The syllable game is the first (and currently only) mini game in Tavuilu. A word image is shown at the top of the screen. Below it, empty drop-target slots represent each syllable position in order. Shuffled syllable chips appear below the slots. The player drags each chip into the correct slot and submits.

---

## Screen Layout

```
┌────────────────────────────────────────────┐
│  [word image — kala.png]                   │
│  "kala"                                    │
│                                            │
│  [ _____ ]  [ _____ ]   ← drop slots      │
│                                            │
│  ( la )  ( ka )         ← syllable chips  │
│                                            │
│         [ Tarkista ]    ← submit button    │
└────────────────────────────────────────────┘
```

- Word image is displayed at top center (max 280px wide on desktop, full-width on mobile).
- The word text is displayed beneath the image in large, readable type.
- Drop slots are rendered in correct order, left to right, with a dashed border when empty. Each slot is labeled only by its position (no text hint inside). When a chip is dragged over a valid slot, the slot highlights.
- Syllable chips are displayed in a randomized row (or wrapping grid on narrow screens) below the slots.
- The submit button is disabled until all slots are filled.

---

## Drag-and-Drop Behavior

Library: `@dnd-kit/core` + `@dnd-kit/sortable`.

### Placing a chip
1. Player picks up a chip (`DragStartEvent`).
2. A ghost/overlay renders at the cursor/finger position.
3. On `DragEndEvent`:
   - If dropped over a slot that is **empty**: chip moves into that slot.
   - If dropped over a slot that is **already occupied**: swap the chips (existing chip returns to chip area, dragged chip takes the slot).
   - If dropped outside any slot: chip returns to its original position (animated).

### Removing a chip from a slot
- Player can drag a chip back out of a slot to unplace it (chip returns to chip area).
- Tapping/clicking a filled slot also unplaces the chip (touch UX on small screens).

### Accessibility
- `@dnd-kit` provides ARIA roles and keyboard drag by default — keep these enabled.
- Each chip has `aria-label` with the syllable text.
- Each slot has `aria-label="Slot {n}"` (or Finnish: `"Paikka {n}"`).

---

## Validation and Submit

The submit button (`Tarkista`) becomes active when every slot is filled.

On submit:
1. Compare the chip order in slots against `word.syllables`.
2. If **correct**: trigger success flow.
3. If **incorrect**: trigger error flow.

Validation is a pure function — no server call. It runs client-side only.

```ts
function validateAnswer(slots: string[], syllables: string[]): boolean {
  return slots.every((chip, i) => chip === syllables[i]);
}
```

---

## Success Flow

1. `motion` plays a confetti particle burst originating from the word image area.
2. The submit button becomes a checkmark and turns green.
3. XP is awarded via `progressStore.addXP(amount)`.
4. Word is marked completed via `progressStore.markWordCompleted(word.id)`.
5. After 1.5 s delay, the round resets for the next word (chips randomized, slots cleared).

XP amounts (see `docs/features/progression.md`):
- Difficulty 1: 10 XP
- Difficulty 2: 20 XP
- Difficulty 3: 35 XP

---

## Error Flow

1. `motion` applies a horizontal shake animation to the slot row (spring-based, settles within ~400 ms).
2. Slots briefly flash red (`--color-error-light` background).
3. After the animation, chips remain in their current positions — the player can correct and try again.
4. No XP penalty. No retry limit.

---

## Round Flow

```
1. Game route mounts
2. useWords(lang, difficulty) fetches word list from GET /api/words
3. A word is selected (see Word Selection below)
4. Image loads, syllable chips rendered in random order
5. Player drags chips to slots
6. Player submits
   ├─ Correct → success flow → wait → next word
   └─ Incorrect → error flow → player tries again
7. On next word: pick next unused word from session list
8. When all session words exhausted: re-shuffle and loop
```

---

## Word Selection

Words are selected from the list returned by `useWords(lang, difficulty)`.

- `difficulty` comes from `settingsStore.difficulty`.
- Within a session, words are presented in shuffled order without immediate repeats.
- Words the player has already completed (`progressStore.completedWordIds`) are deprioritized but not excluded — if the difficulty tier has fewer than 5 unplayed words, completed words re-enter the pool.
- Word selection logic lives in a pure helper `selectNextWord(words, completedIds, sessionPlayed)` — unit-testable.

---

## Component Structure

```
apps/web/src/features/syllable-game/
  GamePage.tsx          ← route component; fetches words, manages round state
  WordDisplay.tsx       ← word image + text at top
  SyllableSlots.tsx     ← row of drop-target slots
  SyllableChips.tsx     ← draggable chip source area
  SyllableChip.tsx      ← single draggable chip
  DropSlot.tsx          ← single drop target
  useGameRound.ts       ← round state machine (current word, slot state, phase)
  selectNextWord.ts     ← pure word selection helper
  validateAnswer.ts     ← pure validation helper
```

`GamePage` is the route component registered at `/game` in React Router. It replaces the current stub `routes/Game.tsx`.

---

## Animations

All animations use `motion` (Framer Motion v11+).

| Event | Animation |
|---|---|
| Chip drag start | Scale up 1.05×, shadow deepens |
| Chip drop to slot | Spring snap into position |
| Chip return (miss) | Spring return to original position |
| Submit correct | Confetti burst (particle system via `motion` variants) |
| Submit incorrect | Horizontal shake on slot row (keyframes: 0 → −8px → +8px → −4px → 0) |
| Next word transition | Slots and chips fade out, new word fades in |

Spring config for chips: `{ type: "spring", stiffness: 400, damping: 30 }`.

---

## Responsive Layout

The game must work on:
- Desktop (1280px+)
- Tablet (768–1024px) — primary target for children
- Large phone (≥390px)

Layout rules:
- Word image: `max-width: 280px` on desktop; `100%` with `max-width: 260px` on tablet/mobile.
- Slot row: horizontal flex, wraps if needed (long words).
- Chip row: horizontal flex, wraps.
- Minimum tap/touch target for chips: 44×44px (WCAG 2.5.5).
- Submit button: full-width on screens <600px.

---

## Tests

**Vitest unit tests** (`src/features/syllable-game/`):
- `validateAnswer`: correct, incorrect, edge cases (single syllable, 4+ syllables, mismatched length)
- `selectNextWord`: returns unused words first, falls back to completed, handles empty list

**Playwright E2E** (`e2e/game.spec.ts`):
- Happy path: drag chips to correct slots, submit → confetti visible, XP incremented
- Error path: submit wrong order → shake animation plays, XP unchanged
- Touch simulation: repeat happy path with Playwright touch events

---

## Out of Scope for Phase 2

- Sound effects (Phase 4)
- Word image art (placeholder images used; real art in Phase 4)
- Multiplayer or leaderboards
- Hint system
