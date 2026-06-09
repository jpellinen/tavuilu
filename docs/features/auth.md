# Auth — Anonymous and Registered Flow

## Overview

On first visit, the app silently creates an anonymous account and starts a session. The player never sees an auth prompt. Progress is stored in Postgres from round one — there is no localStorage-only guest mode.

Account creation is a soft prompt, never a gate. Registering (adding email + password) lets the player access their progress from any device and protects it if the browser is cleared.

Two user modes:

| Mode | How created | Progress storage | Cross-device |
|---|---|---|---|
| Anonymous | Silently on first visit | Postgres | No (tied to session cookie) |
| Registered | Player adds email + password | Postgres | Yes |

---

## Anonymous Mode

On first visit, the frontend calls `POST /api/auth/sign-in/anonymous` (handled by `better-auth`'s anonymous plugin). This creates a `User` row with `isAnonymous: true` and sets an `HttpOnly` session cookie. The player starts playing immediately.

From this point on, all progress is stored server-side under that anonymous user ID. `localStorage` is only used for settings (language, difficulty).

**Risk:** if the player clears cookies or switches browsers, the anonymous session is gone and the progress is unrecoverable. This is the main reason to register.

---

## Registration and Login UI

Registration and login are designed for parents, not children. A child at ages 4–8 cannot type an email or manage a password — the expectation is that a parent or teacher sets up the account.

UI requirements:
- Minimal form: email + password only (no username, no confirm-password field)
- No CAPTCHA
- Error messages are short, plain-language Finnish/English
- The registration screen is reachable from the Settings route, not from the game
- No email verification in Phase 3 (out of scope; add in a later phase if needed)

Routes:
```
/settings      → shows "Create account" / "Log in" link for anonymous users
/auth/login    → login form (email + password)
/auth/register → registration form (email + password)
```

These routes are in `apps/web/src/features/auth/`.

---

## Soft Prompt

After a completed round, if the player is anonymous, show a dismissable banner:

```
"Rekisteröidy, niin edistymisesi säilyy kaikilla laitteilla!"
"Register to keep your progress across devices!"
[Luo tili] [Ehkä myöhemmin]
```

Rules:
- Show at most once per session after the first completed round
- Dismissed state is kept in component local state (not persisted — intentionally resets each session)
- Tapping "Luo tili" navigates to `/auth/register`
- Never block the next round while the prompt is visible

The wording is "across devices", not "save your progress" — progress is already saved. The prompt is about access, not loss prevention.

---

## Session Persistence

`better-auth` issues a session cookie (`HttpOnly`, `SameSite=Lax`) for both anonymous and registered users. The frontend does not store the token manually. On page reload, the session is restored by the browser sending the cookie.

The frontend uses a `useAuth()` hook (in `src/features/auth/useAuth.ts`) that:
- Calls `GET /api/auth/session` on mount to determine the current user
- If no session exists, calls `POST /api/auth/sign-in/anonymous` to create one
- Returns `{ user, loading, isAnonymous }`
- Is the single source of truth for auth state in the UI

```ts
interface AuthState {
  user: { id: string; email: string | null; isAnonymous: boolean };
  loading: boolean;
  isAnonymous: boolean;
}
```

Do not store the token or user ID anywhere other than what `better-auth` manages server-side.

---

## Anonymous-to-Registered Upgrade

When an anonymous player registers, their progress is already in Postgres under their anonymous user ID. `better-auth`'s anonymous plugin handles the account link — it attaches the email + password credentials to the existing `User` row and sets `isAnonymous` to `false`. No data migration, no merge.

Flow:
1. Anonymous player taps "Create account" and submits email + password
2. `better-auth` links the credentials to the current anonymous `User` row
3. The session cookie remains valid — the user ID does not change
4. `useAuth()` now returns `isAnonymous: false`

---

## Login on a New Device

When a registered player logs in on a new device:
1. `POST /api/auth/sign-in/email` sets a new session cookie
2. `GET /api/progress` returns their server-side progress
3. `progressStore` is populated from the server response

No merge is needed. The server holds the canonical state.

---

## Logout

Logout calls `POST /api/auth/sign-out` (handled by `better-auth`), which clears the session cookie. The frontend clears `progressStore` and redirects to Home.

**Anonymous users:** logging out discards the anonymous session. Progress tied to that anonymous account becomes inaccessible unless the player registered first. The logout UI should warn anonymous users before proceeding.

**Registered users:** progress remains in Postgres. Logging back in restores it.
