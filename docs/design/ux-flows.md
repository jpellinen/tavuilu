# UX Flows

## Screen Inventory (Phase 2)

| Screen | Route | Description |
|---|---|---|
| Home | `/` | Entry point. Hero tagline, "Aloita peli" CTA, settings link |
| Game | `/game` | Syllable drag-and-drop game |
| Settings | `/settings` | Language and difficulty selector |

---

## Navigation

The header bar is contextual per screen:

- **Home (`/`):** No header buttons — the page itself contains the settings link below the start button.
- **Game (`/game`):** Home button (house icon) + progress dots.
- **Other pages** (settings, auth): Home button only.

On the game screen, the home button navigates back to `/`.

---

## Home Screen Flow

```
┌──────────────────────────────────┐
│  [Tavuilu logo / wordmark]       │
│                                  │
│  Opitaan lukemaan yhdessä.       │  ← tagline (locale key: "tagline")
│                                  │
│  [ Aloita peli → ]               │  ← navigates to /game
│                                  │
│  Asetukset                       │  ← link to /settings (centered)
│                                  │
│  Level 3 · 245 XP                │  ← read from progressStore (if xp > 0)
└──────────────────────────────────┘
```

- "Aloita peli" button → `navigate('/game')`.
- If the player has no XP yet (first visit), the level/XP line is omitted.
- No account prompt in Phase 2.

---

## Game Screen Flow

### State machine

```
           ┌──────────┐
    mount  │          │
  ─────────► LOADING  │  fetching words via useWords()
           │          │
           └────┬─────┘
                │ words loaded
                ▼
           ┌──────────┐
           │  PLAYING │  ◄────────────────────────────┐
           │          │                                │
           │  word shown, chips displayed               │ next word
           └────┬─────┘                                │
                │ submit (all slots filled)             │
                ▼                                       │
           ┌──────────┐                                │
           │VALIDATING│  (client-side, instant)        │
           └──┬───┬───┘                                │
      correct │   │ incorrect                          │
              │   ▼                                    │
              │ ┌──────────┐                           │
              │ │  ERROR   │  shake + red flash        │
              │ │          │  → return to PLAYING      │
              │ └──────────┘                           │
              ▼                                        │
         ┌──────────┐                                  │
         │ SUCCESS  │  confetti + XP awarded           │
         │          │  → 1.5 s → ──────────────────────┘
         └──────────┘
```

### Loading state
- Spinner centered on screen.
- If fetch fails: inline error message with a "Yritä uudelleen" retry button.

### Playing state
- Word image + text at top.
- Drop slots rendered in order.
- Shuffled chips below.
- Submit button inactive until all slots filled.

### Success state
- Confetti burst from word area.
- Submit button shows checkmark, turns green.
- XP display increments.
- After 1.5 s: reset to PLAYING with next word.

### Error state
- Slot row shakes horizontally.
- Slots flash `--color-error-light`.
- After animation (~400 ms): return to PLAYING.
- Chips stay in place — player can keep trying.

---

## Settings Screen Flow

```
┌──────────────────────────────────┐
│  Asetukset                       │
│                                  │
│  Kieli                           │
│  ● Suomi   ○ English             │
│                                  │
│  Vaikeustaso                     │
│  ○ 1  ● 2  ○ 3                   │
│                                  │
└──────────────────────────────────┘
```

- Changes are applied immediately via `settingsStore.setLanguage()` / `settingsStore.setDifficulty()`.
- No "Save" button — settings persist automatically to localStorage.
- Changing difficulty mid-session: next word will be selected from the new difficulty tier.
- Changing language: `useLocale()` reactivity updates all UI strings instantly without a page reload.

---

## Game Loop Diagram

```
App boot
   │
   ├─ progressStore hydrates from localStorage
   ├─ settingsStore hydrates from localStorage
   │
   ▼
Home screen
   │
   └─ "Aloita peli" tap
         │
         ▼
      Game screen
         │
         ├─ useWords(lang, difficulty) → GET /api/words
         │
         └─ [Round]
               │
               ├─ Show word + shuffled chips
               │
               ├─ Player drags chips to slots
               │
               └─ Submit
                    ├─ Correct: XP awarded, markWordCompleted, next word
                    └─ Incorrect: shake, player retries same word
```

---

## Touch Interaction Notes

The primary input on a children's tablet is touch. Key considerations:

- Chips must be large enough to grab (min 48px height).
- `@dnd-kit` uses `PointerSensor` which handles both mouse and touch natively.
- No hover-only interactions — every interactive state must be reachable by tap.
- Long-press to start drag is not required — immediate drag on `pointerdown`.
- On iOS Safari, ensure `touch-action: none` is set on draggable elements (dnd-kit handles this).

---

## Accessibility Notes

- All interactive elements reachable by keyboard (Tab + Enter/Space).
- `@dnd-kit` provides keyboard drag-and-drop: Space to pick up, arrow keys to move, Space/Enter to drop.
- Home button uses `<Link>` with an accessible `aria-label`.
- Word image has meaningful `alt` text: the word itself (e.g., `alt="kala"`).
- Drop slots labeled with aria: `aria-label="Paikka 1"`, `aria-label="Paikka 2"`, etc.
- Confetti is `aria-hidden` — it's decorative.
- Focus ring visible on all interactive elements (use `--color-primary` outline).

---

## Error States

| Scenario | Handling |
|---|---|
| `GET /api/words` fails | Inline error + retry button in game screen |
| Image fails to load | `<img>` `onError`: show placeholder silhouette |
| Empty word list for difficulty | Show message: "Ei sanoja tällä tasolla." |
| localStorage unavailable | Stores degrade gracefully (data not persisted but app still works) |
