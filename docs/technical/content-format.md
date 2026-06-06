# Content Format

## Overview

Game content — word lists and images — lives in `apps/api/content/`. The API parses and validates word files at startup; the frontend never reads content files directly. Words are served via `GET /api/words`.

---

## File Structure

```
apps/api/content/
  fi.json          ← Finnish word list
  images/
    words/
      kala.png
      auto.png
      koira.png
      …
```

One JSON file per language, named by ISO 639-1 code. Images are in `images/words/`, named `{imageRef}.png`. All filenames lowercase.

---

## Word JSON Schema

Each word list file is a JSON array of word objects.

```ts
interface Word {
  id: string;         // unique, lowercase, matches the Finnish word
  word: string;       // display form of the word (may include Finnish characters: ä, ö, å)
  syllables: string[]; // ordered array of syllables; join them to get the full word
  difficulty: 1 | 2 | 3;
  imageRef: string;   // bare stem used to construct the image URL (no extension, no path)
  tags: string[];     // category tags for future filtering
}
```

Defined in `shared/types.ts` and imported via `@tavuilu/shared`. The Zod schema for API validation lives in `apps/api/src/schemas/wordSchema.ts`.

---

## Syllable Rules

`syllables` is an ordered array. Joining all elements (no separator) must equal `word`:

```
"word": "kala"
"syllables": ["ka", "la"]    ✓  ("ka" + "la" = "kala")

"word": "elefantti"
"syllables": ["e", "le", "fant", "ti"]   ✓  ("e"+"le"+"fant"+"ti" = "elefantti")
```

The API validates this invariant on startup. A mismatch causes a startup error, not a runtime error.

Finnish syllabification follows standard rules:
- Each syllable typically has one vowel nucleus.
- Long vowels and diphthongs (aa, oo, ie, au, etc.) stay together in one syllable.
- Double consonants are split: "pallo" → ["pal", "lo"].

---

## Difficulty Tiers

| Level | Syllable count | Typical age | Examples |
|---|---|---|---|
| 1 | 2 syllables | 4–5 | kala, auto, koti |
| 2 | 3 syllables | 5–7 | banaani, aurinko, perhonen |
| 3 | 4+ syllables | 7–8 | elefantti, sateenkaari |

Difficulty is not a strict syllable count — it reflects overall complexity (syllable structure, vowel harmony, consonant clusters). A 2-syllable word with a consonant cluster (e.g., "kirja") can be difficulty 1 if the cluster is familiar.

---

## `imageRef` Field

`imageRef` is a bare stem — no path, no file extension.

```json
{ "imageRef": "kala" }
```

The frontend resolves this to a full URL using `getImageUrl(imageRef)`:

```ts
// src/utils/getImageUrl.ts
export function getImageUrl(imageRef: string): string {
  const base = import.meta.env.VITE_IMAGE_BASE_URL ?? 'http://localhost:3000';
  return `${base}/images/words/${imageRef}.png`;
}
```

Images are served by Fastify via `@fastify/static` mounted at `/images/words/`.

**Why a bare stem?** It decouples the content format from the deployment topology. Switching from self-hosted to CDN is a single env var change:

```
VITE_IMAGE_BASE_URL=https://cdn.tavuilu.fi
```

No code changes, no JSON changes — just upload images to the CDN and flip the variable.

---

## Placeholder Images

In development and Phase 2, placeholder images are used. A placeholder is a 280×280px PNG with a simple label or colored background. The content validator does not check that image files exist — missing images show the `<img>` element's broken-image state.

Placeholder generation: not scripted. Create manually or generate with any image tool. Filename must match `imageRef` exactly.

---

## Validation at Startup

`apps/api/src/content-loader.ts` runs at server startup:

1. Reads `content/{lang}.json`.
2. Parses JSON.
3. Validates each entry against the Zod schema in `wordSchema.ts`.
4. Validates the syllable join invariant (`syllables.join('') === word`).
5. Throws if any entry is invalid — server does not start with bad content.

This means content errors are caught in CI (the API test suite starts the server) rather than at runtime.

---

## Adding Words

1. Add the word object to `apps/api/content/fi.json`.
2. Add the image as `apps/api/content/images/words/{imageRef}.png`.
3. Run `pnpm --filter api type-check` — Zod validation catches schema errors.
4. Test locally: `GET /api/words?lang=fi&difficulty=1` should return the new word.

---

## Adding a Language

1. Create `apps/api/content/{lang}.json` with the same schema.
2. Add the UI strings file `apps/web/src/i18n/{lang}.json` implementing the full `Locale` interface.
3. Add `{lang}` to the `language` union in `shared/types.ts`.
4. TypeScript will error at build time if any locale key is missing.

No code changes to the API or frontend are needed beyond these three files.

---

## API Endpoint

```
GET /api/words?lang=fi&difficulty=1
```

Query params:
- `lang`: ISO 639-1 code (`fi`, `en`). Required.
- `difficulty`: `1`, `2`, or `3`. Optional — if omitted, returns all difficulties.

Response: JSON array of `Word` objects matching the filters.

Status codes:
- `200` — success (may be empty array if no words match)
- `400` — invalid `lang` or `difficulty` param
- `500` — content loader failed (startup error propagated)
