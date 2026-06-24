# Visual Style Guide

## Principles

- **Joyful and clear**: large shapes, high contrast, generous whitespace. Children ages 4–8 need clear affordances.
- **Playful but not chaotic**: a consistent palette with one warm accent; no clashing rainbow.
- **Accessible**: minimum 4.5:1 contrast ratio for text. Touch targets ≥ 44×44px.
- **Zero visual noise**: no gradients on interactive controls, no heavy drop shadows on text.

---

## Color Palette

All values defined as CSS custom properties in `apps/web/src/styles/tokens.css`.

### Primary (indigo-purple)

| Token | Use |
|---|---|
| `--color-primary` | Nav links, focus rings, icon fills |
| `--color-primary-hover` | Hover/active states |
| `--color-primary-light` | Subtle chip backgrounds |

### Accent (warm orange)

| Token | Use |
|---|---|
| `--color-accent` | Submit button, CTAs |
| `--color-accent-hover` | CTA hover state |
| `--color-accent-light` | Accent tint for highlights |

### Feedback

| Token | Use |
|---|---|
| `--color-success` | Correct answer indicator |
| `--color-success-light` | Success flash background |
| `--color-warning` | Alerts, not yet used in Phase 2 |
| `--color-error` | Error text, incorrect border |
| `--color-error-light` | Error flash on slots |

### Neutrals

| Token | Use |
|---|---|
| `--color-bg` | Page background (warm off-white with slight purple tint) |
| `--color-surface` | Cards, chips, modal surfaces |
| `--color-text` | Body text (near-black with purple tint) |
| `--color-text-muted` | Secondary labels, helper text |
| `--color-border` | Subtle borders, dividers |

---

## Typography

Font: **Nunito** (Google Fonts). Fallback: `system-ui, -apple-system, sans-serif`.

Nunito is rounded and friendly — well-suited for children's interfaces and for Finnish text (long words benefit from clear letterforms).

```css
--font-sans: 'Nunito', system-ui, -apple-system, sans-serif;
```

| Token | Use |
|---|---|
| `--font-size-xs` | Helper text, badges |
| `--font-size-sm` | Secondary labels |
| `--font-size-base` | Body, nav |
| `--font-size-lg` | Card labels |
| `--font-size-xl` | Section headings |
| `--font-size-2xl` | Page headings |
| `--font-size-3xl` | Word display in game |
| `--font-size-4xl` | Hero/mascot display (Phase 4+) |

**Weight:** 700 (bold) for headings and syllable chips; 600 (semibold) for buttons; 400 (regular) for body.

Children's reading: the word displayed in the game uses `--font-size-3xl` at bold weight — large enough to read at arm's length on a tablet.

---

## Spacing

4px base scale — `--space-1` through `--space-16`. See `tokens.css` for current values.

Game layout uses generous spacing — children need clear visual separation between the word, slots, and chip area.

---

## Border Radii

| Token | Use |
|---|---|
| `--radius-sm` | Small UI details |
| `--radius-md` | Cards, chips |
| `--radius-lg` | Panels, modals |
| `--radius-xl` | Image frame |
| `--radius-full` | Pill shapes (submit button on mobile) |

Syllable chips use `--radius-md` for a friendly pill feel without being a full oval.

---

## Shadows

| Token | Use |
|---|---|
| `--shadow-sm` | Chip at rest: subtle lift |
| `--shadow-md` | Card: medium depth |
| `--shadow-lg` | Chip while dragging: emphasised elevation |

No text shadows. Shadows use the dark text color with low opacity so they read correctly on both light and tinted backgrounds.

---

## Transitions

| Token | Use |
|---|---|
| `--transition-fast` | Button hover, slot highlight |
| `--transition-base` | State changes |
| `--transition-slow` | Page transitions (not yet in Phase 2) |

Use CSS transitions for hover/focus states. Use `motion` (Framer Motion) for game animations (confetti, shake, chip snap).

---

## Component Appearances

### Syllable Chip (at rest)
- Background: `--color-surface`
- Border: solid `--color-primary`
- Text: `--color-primary`, `--font-size-xl`, weight 700
- Border radius: `--radius-md`
- Shadow: `--shadow-sm`
- Padding: `--space-3` vertical, `--space-5` horizontal
- Sized to be comfortably tappable for small hands

### Syllable Chip (dragging)
- Slight scale-up
- Shadow: `--shadow-lg`
- Reduced opacity
- Cursor: grabbing

### Drop Slot (empty)
- Background: `--color-bg`
- Border: dashed `--color-border`
- Border radius: `--radius-md`
- Sized slightly larger than a chip so it's a clear drop target
- Transition: border-color `--transition-fast`

### Drop Slot (active / chip hovering over)
- Border: solid `--color-primary`
- Background: `--color-primary-light`

### Drop Slot (filled)
- Border: solid `--color-primary`
- Background: `--color-surface`
- Chip rendered inside slot

### Submit Button (inactive)
- Background: `--color-border`
- Text: `--color-text-muted`
- Cursor: not-allowed

### Submit Button (active)
- Background: `--color-accent`
- Text: white
- Hover: `--color-accent-hover`
- Border radius: `--radius-md`
- Font size: `--font-size-lg`, weight 600

---

## Animation Principles

- **Spring physics** for chip movement — snappy, never linear.
- **Confetti** on success: colored circles (using primary, accent, success, warning colors) burst outward from the word area and fall off-screen. Should feel celebratory but brief.
- **Shake** on error: the slot row oscillates horizontally and slots flash red. Quick and clear, no bounce after.
- **Fade** for word transitions: current word content fades out, new word fades in.
- Avoid flashing more than 3 times per second (WCAG 2.3.1 photosensitivity).

---

## Responsive Breakpoints

Not using a utility library — breakpoints are defined inline in CSS Modules with `@media`.

| Name | Target device |
|---|---|
| `sm` | Large phone |
| `md` | Small tablet |
| `lg` | Tablet (primary) |
| `xl` | Large tablet / laptop |

Breakpoint values are defined in `tokens.css`. The game layout is designed **mobile-first**: base styles target phones, then wider breakpoints adapt for tablets.
