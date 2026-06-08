---
name: run-tavuilu-web
description: Launch and drive the Tavuilu web app (apps/web, React + Vite) in a real browser to verify a feature visually. Use when asked to run, demo, screenshot, or manually verify the web app — e.g. the syllable game, drag-and-drop, routing, locale switching.
---

# Running and driving Tavuilu's web app

The web app is a Vite + React SPA served at `http://localhost:5173`, proxying
`/api` to the Fastify backend at `http://localhost:3000`. It normally runs via
Docker Compose alongside `api` and `db`.

## 1. Make sure the stack is up

```bash
cd /Users/juha/Coding/tavuilu
docker compose ps
# if not running:
docker compose up -d
timeout 60 bash -c 'until curl -sf http://localhost:5173 >/dev/null; do sleep 1; done'
```

## 2. Gotcha: new dependencies don't appear in the running container

`docker-compose.yml` mounts `./apps/web:/app/apps/web` but keeps
`node_modules` as a separate **anonymous volume** baked into the image. If you
`pnpm add` a package on the host (e.g. while implementing a feature that needs
`@dnd-kit/core`), the running `web` container still has the old `node_modules`
and Vite will fail to resolve the new import with a 500 error
(`Failed to resolve import "..." from "...". Does the file exist?`).

Fix: install inside the running container too (it shares the lockfile via the
mounted `apps/web` directory):

```bash
docker exec tavuilu-web-1 sh -c "cd /app/apps/web && pnpm install"
```

Vite hot-reloads after that — no restart needed.

## 3. Drive it with Playwright

`apps/web` now has `@playwright/test` as a devDependency with browsers already
installed via `pnpm exec playwright install chromium` — no scratch-directory
bootstrap needed. Reuse it directly:

```bash
cd /Users/juha/Coding/tavuilu/apps/web
```

For a one-off ad-hoc drive (screenshots, exploratory checks), write a small
script using the project's installed `playwright` package and run it with
`pnpm exec tsx verify.ts` or plain `node`:

```js
const { chromium } = require('playwright')

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const errors = []
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('http://localhost:5173/game', { waitUntil: 'networkidle' })
  await page.waitForSelector('[aria-label="Paikka 1"]', { timeout: 30000 })
  await page.screenshot({ path: '/tmp/tavuilu-verify/01-initial.png' })

  // ... interactions ...

  console.log('console errors:', errors)
  await browser.close()
}

main().catch((err) => { console.error(err); process.exit(1) })
```

Read the resulting PNGs with the Read tool to visually confirm — a screenshot
on disk that you never look at proves nothing.

For verifying the actual drag-and-drop round behavior (success/error paths,
XP awarding, confetti), prefer running the project's own E2E suite instead of
writing a one-off script — it already covers this:

```bash
pnpm playwright              # runs apps/web/e2e/game.spec.ts against a dev server it boots itself
```

See `apps/web/e2e/game.spec.ts` for the canonical drag helper (`dragOnto`),
including the activation-distance and drop-animation timing notes below.

## App-specific notes

- **Routes**: `/`, `/game`, `/settings` (see `apps/web/src/App.tsx`).
- **Locale**: UI strings are Finnish by default (`fi.json`). Slot labels read
  `aria-label="Paikka {n}"`, syllable chips `aria-label="{syllable}"`.
- **Drag-and-drop (syllable game)**: built with `@dnd-kit/core`. Real pointer
  drags need intermediate `page.mouse.move()` steps — dnd-kit's `PointerSensor`
  has an 8px activation-distance constraint, so a single jump from A to B
  without intermediate moves never starts a drag. Pattern:

  ```js
  await page.mouse.move(sx, sy)
  await page.mouse.down()
  await page.mouse.move(sx + 10, sy + 10, { steps: 5 })   // clears the activation distance
  await page.mouse.move(tx, ty, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(400)                           // let dnd-kit settle + React re-render
  ```

  Inspect placement state via `page.evaluate(() => ...)` reading `aria-label`
  and `textContent` of `[aria-label^="Paikka"]` (slots) and chip elements,
  rather than relying on brittle CSS-class selectors.

## Cleanup

If you wrote an ad-hoc driver script and screenshots to `/tmp/tavuilu-verify`,
remove it when done (`rm -rf /tmp/tavuilu-verify`) unless you expect to verify
again soon in the same session. The project's own E2E suite
(`apps/web/e2e/`, run via `pnpm playwright`) needs no cleanup — its
`test-results/`/`playwright-report/` output is gitignored.
