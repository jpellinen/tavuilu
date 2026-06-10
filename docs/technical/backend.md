# Backend — Technical Reference

## Setup

```
apps/api/
  src/
    routes/             ← Fastify route handlers (words.ts, progress.ts)
    plugins/            ← Fastify plugins
    schemas/            ← Zod validation schemas
    content-loader.ts   ← Parses fi.json at startup; re-exported to routes
    index.ts            ← Fastify app entry; registers plugins and routes
  content/
    fi.json             ← Finnish word list
    images/words/       ← Word images (served as static files)
```

Fastify listens on `PORT` (default `3000`). In dev, Vite proxies `/api` to port `3000`.

---

## Plugins

Registered in `index.ts` in this order:

| Plugin | Purpose |
|---|---|
| `@fastify/static` | Serves `content/images/` at `/images/` |
| `@fastify/cookie` | Cookie parsing (required by better-auth) |
| `@fastify/cors` | CORS for local dev (origin: `http://localhost:5173`) |
| `better-auth/fastify` | Mounts all auth routes at `/api/auth/*`; anonymous plugin enabled |

---

## Routes

### `GET /api/words`

Returns word list filtered by language and difficulty.

Query params:
| Param | Type | Required | Description |
|---|---|---|---|
| `lang` | `"fi"` | yes | Content language |
| `difficulty` | `1 \| 2 \| 3` | no | Filter by difficulty; omit to return all |

Response `200`:
```json
[
  {
    "id": "kala",
    "word": "kala",
    "syllables": ["ka", "la"],
    "difficulty": 1,
    "imageRef": "kala",
    "tags": ["animals", "water"]
  }
]
```

Response `400`: `{ "error": "Invalid query parameters" }` (Zod validation failure).

The word list is loaded from `fi.json` at startup by `content-loader.ts`. The route handler filters the in-memory array — no database query.

---

### `POST /api/auth/sign-in/anonymous`

Handled by `better-auth`'s anonymous plugin. Creates a `User` row with `isAnonymous: true`, starts a session, sets `HttpOnly` session cookie. Called by `useAuth()` on first visit when no session exists.

Response `200`: session object.

---

### `GET /api/auth/session`

Handled by `better-auth`. Returns the current session if the session cookie is valid.

Response `200` (authenticated):
```json
{
  "user": { "id": "...", "email": "user@example.com", "isAnonymous": false },
  "session": { "id": "...", "expiresAt": "..." }
}
```

For an anonymous user, `email` is `null` and `isAnonymous` is `true`.

Response `401` (no valid session):
```json
{ "user": null, "session": null }
```

---

### `POST /api/auth/sign-up/email`

Handled by `better-auth`. Always creates a **new** `User` row and a new session — it does not convert the existing anonymous row in place.

When called with an active anonymous session, the anonymous plugin's `onLinkAccount` hook (configured in `apps/api/src/auth.ts`) reassigns the anonymous user's `Progress` row to the new user's ID before `better-auth` deletes the old anonymous `User` row. The result: the new account starts with the anonymous player's XP/level/completed words intact, under a new user ID.

Accepts `{ name, email, password }`. Returns `200` with the new user + session on success.

---

### `POST /api/auth/sign-in/email`

Handled by `better-auth`. Accepts `{ email, password }`. Returns `200` with session on success, `401` on bad credentials.

When called with an active anonymous session, the same `onLinkAccount` hook fires (the anonymous plugin links any session that follows an anonymous one). If the target account already has a `Progress` row, the hook leaves it untouched — the existing account's progress is canonical, and the anonymous user (and its `Progress` row) is deleted by `better-auth`. The anonymous session's progress is **not** merged or preserved in this case.

---

### `POST /api/auth/sign-out`

Handled by `better-auth`. Clears the session cookie.

---

### `GET /api/progress`

Returns the authenticated user's progress from Postgres.

Auth: session cookie required (anonymous or registered). Returns `401` if no session.

Response `200`:
```json
{
  "xp": 245,
  "level": 3,
  "completedWordIds": ["kala", "auto", "koira"]
}
```

If no progress row exists yet, returns `{ "xp": 0, "level": 1, "completedWordIds": [] }`.

---

### `POST /api/progress/round`

Records a completed round and awards XP. The server is the sole authority on XP — the client never submits a score.

Auth: session cookie required (anonymous or registered). Returns `401` if no session.

Request body:
```json
{
  "wordId": "kala",
  "durationMs": 7500,
  "correct": true,
  "firstAttempt": true
}
```

| Field | Type | Description |
|---|---|---|
| `wordId` | `string` | Must exist in the loaded word list; used to look up difficulty |
| `durationMs` | `number` | Milliseconds from word display to correct submission |
| `correct` | `boolean` | Whether the submission was correct |
| `firstAttempt` | `boolean` | Whether this was the first attempt on this word |

Server logic:
1. Looks up `wordId` in the in-memory word list. Returns `400` if not found.
2. If `correct` is `false`, returns the unchanged progress (no XP awarded).
3. Computes XP:
   ```ts
   function computeXP(difficulty: 1 | 2 | 3, durationMs: number, firstAttempt: boolean): number {
     const base = difficulty === 1 ? 10 : difficulty === 2 ? 20 : 35;
     const speedBonus = firstAttempt && durationMs <= 10_000 ? 5 : 0;
     return base + speedBonus;
   }
   ```
4. Upserts the `Progress` row: increments `xp`, recomputes `level`, appends `wordId` to `completedWordIds` (if not already present).

Response `200`: the updated progress object.

```json
{
  "xp": 260,
  "level": 3,
  "completedWordIds": ["kala", "auto", "koira", "pallo"]
}
```

The client updates `progressStore` with the returned values.

---

## Auth Middleware

All progress routes use a `preHandler` that verifies the session via `better-auth`. Both anonymous and registered sessions are accepted — every user has a session from first visit.

```ts
async function requireSession(request, reply) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
  request.userId = session.user.id;
}
```

`request.userId` is the Postgres `User.id` — identical for anonymous and registered users.

---

## Request Validation

All query params and request bodies are validated with Zod schemas in `src/schemas/`. On a validation failure, Fastify returns `400` with a `{ "error": string }` body. Validation errors are never exposed as raw Zod error objects.

---

## Error Handling

All route handlers return errors as `{ "error": string }`. HTTP status codes:

| Status | Meaning |
|---|---|
| `400` | Invalid request (Zod schema failure, unknown `wordId`) |
| `401` | No valid session |
| `404` | Resource not found |
| `500` | Unhandled server error (logged, not exposed) |

Unhandled errors are caught by Fastify's global error handler, which logs the stack trace and returns `500` without leaking internals.
