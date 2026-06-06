# Tavuilu — Product Overview

## Vision

Tavuilu (Finnish: "syllable-playing") is a web app that helps Finnish children ages 4–8 learn to read through colorful, low-stakes mini games. The core loop is: see a picture, hear the word in your head, drag the syllable chips into the right order. Success is immediate and visual. There are no wrong paths — only gentle nudges back on track.

The app is designed for children to use independently or with a parent. Accounts are optional; every feature works as a guest. Creating an account lets progress survive device changes and browser clears.

---

## Target Personas

**Aino, age 5** — Just starting to recognize syllables. Uses a parent's tablet. Needs large tap targets, zero reading required in the UI, and immediate reward feedback.

**Mikko, age 7** — Can read simple words. Uses a family desktop. Likes to see his score go up. Can handle a slightly harder word list and smaller controls.

**Parent** — Wants something safe, ad-free, and progress-trackable. Does not want to create an account just to let their child play.

---

## Game Loop

```
Home screen
  └─ Start game (picks difficulty from current level)
       └─ Round
            ├─ Word image shown at top
            ├─ Syllable chips scattered below (randomised order)
            ├─ Child drags chips into correct slots
            ├─ Submit: correct → confetti + XP → next round
            └─ Submit: wrong → shake + try again (no penalty)
       └─ After N rounds → summary screen (XP earned, level progress)
            └─ Soft prompt if guest: "Save your progress — create a free account!"
```

---

## Feature List

### Launched at Phase 1
- Design system: color palette, typography, CSS custom properties
- Route stubs: Home, Game, Settings
- Zustand stores: settings (language, difficulty) + progress (XP, level)
- i18n: Finnish locale strings, `useLocale()` hook
- API: word list endpoint + static image serving

### Phase 2
- Fully playable syllable drag-and-drop game
- XP/level progression
- Responsive layout (desktop, tablet, phone)
- Touch support

### Phase 3
- Guest vs. account auth flow (better-auth)
- Cloud sync of progress to Postgres
- Guest-to-account upgrade (no progress lost)

### Phase 4 (TBD)
- Real word illustrations (AI-generated or hand-drawn)
- Sound effects
- Second mini game
- Additional languages
- PWA (offline, installable)

---

## Scope Boundaries

- **No ads, tracking, or third-party analytics.**
- **No mandatory login.** Every game feature works as a guest.
- **No social features** in the initial phases.
- **No native app.** Web-first; PWA is Phase 4.
- Reward mechanic (what XP/levels unlock) is **TBD** — data model is scaffolded, reward UI is deferred to Phase 4.

---

## Content Model

Words are stored in language-specific JSON files (`apps/api/content/fi.json`). Each word has a unique id, an array of syllables, a difficulty tier (1–3), an image reference, and optional tags.

Difficulty tiers map to age ranges:
| Tier | Syllables | Example | Age |
|------|-----------|---------|-----|
| 1 | 2, simple CV | ka-la, au-to | 4–5 |
| 2 | 3 syllables | ki-ra-puu → ki-ra-pu | 5–7 |
| 3 | 4+ syllables | he-li-kop-te-ri | 7–8 |

Images are PNG files co-located with the content under `apps/api/content/images/words/`. The frontend resolves `imageRef` to a URL via `getImageUrl(imageRef)` using `VITE_IMAGE_BASE_URL`.
