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

async function dragOnto(page: Page, source: Locator, target: Locator) {
  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  if (!sourceBox || !targetBox) throw new Error('Could not measure drag source/target')

  const start = { x: sourceBox.x + sourceBox.width / 2, y: sourceBox.y + sourceBox.height / 2 }
  const end = { x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2 }

  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  // Move past dnd-kit's PointerSensor activation distance before heading to the target.
  await page.mouse.move(start.x + 12, start.y + 12, { steps: 5 })
  await page.mouse.move(end.x, end.y, { steps: 10 })
  await page.mouse.move(end.x, end.y, { steps: 2 })
  await page.mouse.up()
  // dnd-kit plays a ~250ms drop animation while the chip settles into the slot;
  // clicking too soon lands the pointer on the animating overlay instead of the
  // real target underneath, so let it finish before the next interaction.
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

test('dragging syllables into the correct order awards XP and shows a success burst', async ({
  page,
}) => {
  await mockWordsApi(page, [KALA])
  const progressRound = await mockProgressRoundApi(page)
  await page.goto('/game')

  await expect(page.getByRole('group', { name: 'kala' })).toBeVisible()

  await dragOnto(page, chip(page, 'ka'), slot(page, 0))
  await expect(slot(page, 0)).toContainText('ka')
  await dragOnto(page, chip(page, 'la'), slot(page, 1))
  await expect(slot(page, 1)).toContainText('la')

  await page.getByRole('button', { name: 'Tarkista' }).click()

  await expect(page.getByText('Oikein!')).toBeVisible()
  await expect(page.getByTestId('confetti-burst')).toBeVisible()

  await expect(() => expect(progressRound.getRequest()).not.toBeNull()).toPass()
  expect(progressRound.getRequest()).toMatchObject({ wordId: KALA.id, correct: true })
})

test('shows a dismissable register prompt for anonymous users after completing a round', async ({
  page,
}) => {
  await mockWordsApi(page, [KALA])
  await mockProgressRoundApi(page)
  await page.goto('/game')

  await expect(page.getByRole('group', { name: 'kala' })).toBeVisible()

  await dragOnto(page, chip(page, 'ka'), slot(page, 0))
  await dragOnto(page, chip(page, 'la'), slot(page, 1))
  await page.getByRole('button', { name: 'Tarkista' }).click()

  await expect(page.getByText('Oikein!')).toBeVisible()

  const prompt = page.getByText('Rekisteröidy, niin edistymisesi säilyy kaikilla laitteilla!')
  await expect(prompt).toBeVisible()

  await page.getByRole('button', { name: 'Ehkä myöhemmin' }).click()
  await expect(prompt).not.toBeVisible()
})

test('submitting syllables in the wrong order shakes the slots and awards no XP', async ({
  page,
}) => {
  await mockWordsApi(page, [KALA])
  const progressRound = await mockProgressRoundApi(page)
  await page.goto('/game')

  await expect(page.getByRole('group', { name: 'kala' })).toBeVisible()

  // Deliberately reversed order.
  await dragOnto(page, chip(page, 'la'), slot(page, 0))
  await expect(slot(page, 0)).toContainText('la')
  await dragOnto(page, chip(page, 'ka'), slot(page, 1))
  await expect(slot(page, 1)).toContainText('ka')

  await page.getByRole('button', { name: 'Tarkista' }).click()

  await expect(page.getByText('Yritä uudelleen')).toBeVisible()
  await expect(page.getByText('Oikein!')).not.toBeVisible()

  expect(progressRound.getRequest()).toBeNull()
})
