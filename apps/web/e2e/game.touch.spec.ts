import { test, expect, type Page, type Locator } from '@playwright/test'
import type { Word } from '@tavuilu/shared'

const KALA: Word = {
  id: 'kala',
  word: 'kala',
  syllables: ['ka', 'la'],
  difficulty: 1,
  imageRef: 'kala',
  tags: ['animals'],
}

const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgAAIAAAUAAen63NgAAAAASUVORK5CYII=',
  'base64'
)

async function mockWordsApi(page: Page, words: Word[]) {
  await page.route('**/api/words**', (route) => route.fulfill({ json: words }))
  await page.route('**/images/**', (route) =>
    route.fulfill({ contentType: 'image/png', body: TRANSPARENT_PNG })
  )
}

interface ProgressRoundRequest {
  wordId: string
  durationMs: number
  correct: boolean
  firstAttempt: boolean
}

async function mockProgressRoundApi(page: Page) {
  let request: ProgressRoundRequest | null = null
  await page.route('**/api/progress/round', async (route) => {
    request = route.request().postDataJSON() as ProgressRoundRequest
    await route.fulfill({ json: { xp: 10, level: 1, completedWordIds: [] } })
  })
  return { getRequest: () => request }
}

/**
 * Simulates a touch drag via CDP Input.dispatchTouchEvent so Chrome synthesises
 * real PointerEvents with pointerType:'touch'.  Synthetic JS dispatchEvent
 * bypasses Chrome's trusted-event pipeline; CDP events do not.
 *
 * dnd-kit PointerSensor has distance:8 activation constraint, so we send a
 * short over-threshold move before travelling to the target.
 */
async function touchDragOnto(page: Page, source: Locator, target: Locator) {
  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  if (!sourceBox || !targetBox) throw new Error('Could not get bounding boxes for touch drag')

  const sx = sourceBox.x + sourceBox.width / 2
  const sy = sourceBox.y + sourceBox.height / 2
  const ex = targetBox.x + targetBox.width / 2
  const ey = targetBox.y + targetBox.height / 2

  const session = await page.context().newCDPSession(page)

  try {
    const tp = (x: number, y: number) => ({
      x,
      y,
      id: 1,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1,
    })

    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [tp(sx, sy)],
    })

    // First move exceeds the 8px activation distance threshold.
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [tp(sx + 10, sy)],
    })

    const STEPS = 10
    for (let i = 1; i <= STEPS; i++) {
      const t = i / STEPS
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [tp(sx + (ex - sx) * t, sy + (ey - sy) * t)],
      })
    }

    // touchEnd: per CDP spec, TouchEnd must not contain active touch points.
    // Chrome uses the position from the last touchMove as the release point.
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
  } finally {
    await session.detach()
  }

  // Wait for dnd-kit's drop animation to finish before the next interaction.
  await page.waitForTimeout(300)
}

function chip(page: Page, syllable: string): Locator {
  return page.locator(`[aria-label="${syllable}"]`)
}

function slot(page: Page, index: number): Locator {
  return page.locator(`[aria-label="Paikka ${index + 1}"]`)
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear())
})

test('touch drag correct order awards XP and shows success burst', async ({ page }) => {
  await mockWordsApi(page, [KALA])
  const progressRound = await mockProgressRoundApi(page)
  await page.goto('/game')

  await expect(page.getByRole('group', { name: 'kala' })).toBeVisible()

  await touchDragOnto(page, chip(page, 'ka'), slot(page, 0))
  await expect(slot(page, 0)).toContainText('ka')
  await touchDragOnto(page, chip(page, 'la'), slot(page, 1))
  await expect(slot(page, 1)).toContainText('la')

  await page.getByRole('button', { name: 'Tarkista' }).click()

  await expect(page.getByText('Oikein!')).toBeVisible()
  await expect(page.getByTestId('confetti-burst')).toBeVisible()

  await expect(() => expect(progressRound.getRequest()).not.toBeNull()).toPass()
  expect(progressRound.getRequest()).toMatchObject({ wordId: KALA.id, correct: true })
})

test('touch drag wrong order shakes and awards no XP', async ({ page }) => {
  await mockWordsApi(page, [KALA])
  const progressRound = await mockProgressRoundApi(page)
  await page.goto('/game')

  await expect(page.getByRole('group', { name: 'kala' })).toBeVisible()

  // Deliberately reversed order.
  await touchDragOnto(page, chip(page, 'la'), slot(page, 0))
  await expect(slot(page, 0)).toContainText('la')
  await touchDragOnto(page, chip(page, 'ka'), slot(page, 1))
  await expect(slot(page, 1)).toContainText('ka')

  await page.getByRole('button', { name: 'Tarkista' }).click()

  await expect(page.getByText('Yritä uudelleen')).toBeVisible()
  await expect(page.getByText('Oikein!')).not.toBeVisible()

  expect(progressRound.getRequest()).toBeNull()
})
