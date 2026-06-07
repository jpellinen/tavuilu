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

> **TODO (Phase 2 step 9):** Once `apps/web/e2e/` and the Playwright E2E suite
> exist (`docs/technical/frontend.md` / `PLAN.md` Phase 2 step 9), replace the
> scratch-directory setup below with the project's own `@playwright/test`
> devDependency — `npx playwright test` or its installed browsers can be reused
> directly instead of bootstrapping a throwaway npm project each time.

`chromium-cli` is not installed in this environment. Use Playwright directly —
it is not a project dependency yet, so install it in a scratch directory:

```bash
mkdir -p /tmp/tavuilu-verify && cd /tmp/tavuilu-verify
npm init -y >/dev/null 2>&1
npm install playwright@1.60.0 >/dev/null 2>&1
npx playwright install chromium
```

Then write a small driver script (`verify.js`) and run it with `node verify.js`.
Skeleton:

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

The scratch Playwright project in `/tmp/tavuilu-verify` is disposable —
remove it when done (`rm -rf /tmp/tavuilu-verify`) unless you expect to verify
again soon in the same session.
