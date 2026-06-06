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

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `#5b6cf5` | Nav links, focus rings, icon fills |
| `--color-primary-hover` | `#4857e0` | Hover/active states |
| `--color-primary-light` | `#e8ebff` | Subtle chip backgrounds |

### Accent (warm orange)

| Token | Value | Use |
|---|---|---|
| `--color-accent` | `#ff8c42` | Submit button, CTAs |
| `--color-accent-hover` | `#e6762c` | CTA hover state |
| `--color-accent-light` | `#fff0e6` | Accent tint for highlights |

### Feedback

| Token | Value | Use |
|---|---|---|
| `--color-success` | `#3bb87f` | Correct answer indicator |
| `--color-success-light` | `#e0f7ee` | Success flash background |
| `--color-warning` | `#ffd166` | Alerts, not yet used in Phase 2 |
| `--color-error` | `#ef4444` | Error text, incorrect border |
| `--color-error-light` | `#fee2e2` | Error flash on slots |

### Neutrals

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#f7f5ff` | Page background (warm off-white with slight purple tint) |
| `--color-surface` | `#ffffff` | Cards, chips, modal surfaces |
| `--color-text` | `#1c1640` | Body text (near-black with purple tint) |
| `--color-text-muted` | `#6b6b8a` | Secondary labels, helper text |
| `--color-border` | `#e2e0f0` | Subtle borders, dividers |

---

## Typography

Font: **Nunito** (Google Fonts). Fallback: `system-ui, -apple-system, sans-serif`.

Nunito is rounded and friendly — well-suited for children's interfaces and for Finnish text (long words benefit from clear letterforms).

```css
--font-sans: 'Nunito', system-ui, -apple-system, sans-serif;
```

| Token | rem | px | Use |
|---|---|---|---|
| `--font-size-xs` | 0.75 | 12 | Helper text, badges |
| `--font-size-sm` | 0.875 | 14 | Secondary labels |
| `--font-size-base` | 1.0 | 16 | Body, nav |
| `--font-size-lg` | 1.125 | 18 | Card labels |
| `--font-size-xl` | 1.375 | 22 | Section headings |
| `--font-size-2xl` | 1.75 | 28 | Page headings |
| `--font-size-3xl` | 2.25 | 36 | Word display in game |
| `--font-size-4xl` | 3.0 | 48 | Hero/mascot display (Phase 4+) |

**Weight:** 700 (bold) for headings and syllable chips; 600 (semibold) for buttons; 400 (regular) for body.

Children's reading: the word displayed in the game uses `--font-size-3xl` at bold weight — large enough to read at arm's length on a tablet.

---

## Spacing

4px base scale:

```
--space-1: 0.25rem   (4px)
--space-2: 0.5rem    (8px)
--space-3: 0.75rem   (12px)
--space-4: 1rem      (16px)
--space-6: 1.5rem    (24px)
--space-8: 2rem      (32px)
--space-10: 2.5rem   (40px)
--space-12: 3rem     (48px)
--space-16: 4rem     (64px)
```

Game layout uses generous spacing — children need clear visual separation between the word, slots, and chip area.

---

## Border Radii

```
--radius-sm: 8px     ← small UI details
--radius-md: 16px    ← cards, chips
--radius-lg: 24px    ← panels, modals
--radius-xl: 32px    ← image frame
--radius-full: 9999px ← pill shapes (submit button on mobile)
```

Syllable chips use `--radius-md` (16px) for a friendly pill feel without being a full oval.

---

## Shadows

```
--shadow-sm   ← chip at rest: subtle lift
--shadow-md   ← card: medium depth
--shadow-lg   ← chip while dragging: emphasised elevation
```

No text shadows. Shadows use the dark text color with low opacity so they read correctly on both light and tinted backgrounds.

---

## Transitions

```
--transition-fast: 120ms ease   ← button hover, slot highlight
--transition-base: 200ms ease   ← state changes
--transition-slow: 350ms ease   ← page transitions (not yet in Phase 2)
```

Use CSS transitions for hover/focus states. Use `motion` (Framer Motion) for game animations (confetti, shake, chip snap).

---

## Component Appearances

### Syllable Chip (at rest)
- Background: `--color-surface`
- Border: 2px solid `--color-primary`
- Text: `--color-primary`, `--font-size-xl`, weight 700
- Border radius: `--radius-md`
- Shadow: `--shadow-sm`
- Padding: `--space-3` vertical, `--space-5` horizontal
- Min width: 56px; min height: 48px

### Syllable Chip (dragging)
- Scale: 1.05×
- Shadow: `--shadow-lg`
- Opacity: 0.9
- Cursor: grabbing

### Drop Slot (empty)
- Background: `--color-bg`
- Border: 2px dashed `--color-border`
- Border radius: `--radius-md`
- Min width: 64px; height: 56px
- Transition: border-color `--transition-fast`

### Drop Slot (active / chip hovering over)
- Border: 2px solid `--color-primary`
- Background: `--color-primary-light`

### Drop Slot (filled)
- Border: 2px solid `--color-primary`
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

- **Spring physics** for chip movement — snappy, never linear. Stiffness 400, damping 30.
- **Confetti** on success: 20–30 colored circles (using primary, accent, success, warning colors) burst outward from the word area and fall off-screen. Duration ~1.2 s.
- **Shake** on error: the slot row oscillates horizontally and slots flash red. Duration ~400 ms. No bounce after.
- **Fade** for word transitions: current word content fades out, new word fades in (200 ms each, 100 ms gap).
- Avoid flashing more than 3 times per second (WCAG 2.3.1 photosensitivity).

---

## Responsive Breakpoints

Not using a utility library — breakpoints are defined inline in CSS Modules with `@media`.

| Name | Min-width | Target device |
|---|---|---|
| `sm` | 390px | Large phone |
| `md` | 600px | Small tablet |
| `lg` | 768px | Tablet (primary) |
| `xl` | 1024px | Large tablet / laptop |

The game layout is designed **mobile-first**: base styles target phones, then `@media (min-width: 768px)` adapts for tablets.
