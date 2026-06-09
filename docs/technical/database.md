# Database — Schema and Local Storage

## Overview

All progress is stored in Postgres from round one. Every user — anonymous or registered — has a server-side identity from first visit.

| Layer | Stores | Managed by |
|---|---|---|
| PostgreSQL | User identity, sessions, progress | Prisma + better-auth |
| `localStorage` | Settings only (language, difficulty) | Zustand `persist` middleware |

There is no localStorage-based progress. `progressStore` is a display cache populated from server responses, not a persistence layer.

---

## Postgres Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// better-auth tables — managed by the Prisma adapter; do not edit manually
model User {
  id            String    @id @default(cuid())
  email         String?   @unique   // null for anonymous users
  emailVerified Boolean   @default(false)
  isAnonymous   Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions  Session[]
  accounts  Account[]
  progress  Progress?
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String    @id @default(cuid())
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([providerId, accountId])
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// App-specific table
model Progress {
  id               String   @id @default(cuid())
  userId           String   @unique
  xp               Int      @default(0)
  level            Int      @default(1)
  completedWordIds String[] @default([])
  updatedAt        DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

`User`, `Session`, `Account`, and `Verification` are owned by the `better-auth` Prisma adapter. The `isAnonymous` field is added by better-auth's anonymous plugin. `Progress` is the only app-owned table.

---

## `Progress` Table

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `userId` | `String` | Foreign key → `User.id`; unique (one row per user) |
| `xp` | `Int` | Cumulative XP; incremented by the server on each correct round |
| `level` | `Int` | Computed server-side from `xp` via `levelFromXP`; stored for convenience |
| `completedWordIds` | `String[]` | Append-only set of completed `Word.id` values |
| `updatedAt` | `DateTime` | Auto-updated on every write |

The server is the sole writer of this table. The client never submits XP values directly.

---

## Migrations

```bash
# Create a migration after schema changes
cd apps/api && pnpm prisma migrate dev --name <description>

# Apply pending migrations in production
cd apps/api && pnpm prisma migrate deploy
```

In dev, `DATABASE_URL` points to the `db` service in Docker Compose. Migrations run automatically on `docker compose up` via an `api` container entrypoint script.

---

## `localStorage` Shape

Only settings are persisted to `localStorage`. Progress is not stored locally.

### `tavuilu-settings`

```json
{
  "state": {
    "language": "fi",
    "difficulty": 1
  },
  "version": 0
}
```

The `version` field is the Zustand persist version. If the schema changes, increment `version` and provide a `migrate` function in the store definition.

`progressStore` is still a Zustand store, but it uses no `persist` middleware — it is populated from `GET /api/progress` on mount and updated from `POST /api/progress/round` responses.

---

## Anonymous Account Cleanup

Anonymous accounts that are never upgraded accumulate in the database. A background cleanup job should periodically delete anonymous users who:
- Have `isAnonymous: true`
- Have `xp = 0` (never played a single round)
- Were created more than 7 days ago

Or more broadly: anonymous users with `updatedAt` older than 90 days. This prevents unbounded table growth without affecting active players.

Implement as a scheduled Postgres query or a cron job in the API container. Not required in Phase 3 but should be added before production launch.

---

## Docker Compose Database Service

```yaml
# docker-compose.yml (db service excerpt)
db:
  image: postgres:16-alpine
  environment:
    POSTGRES_USER: tavuilu
    POSTGRES_PASSWORD: tavuilu
    POSTGRES_DB: tavuilu
  ports:
    - "5432:5432"
  volumes:
    - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Connection string for local dev: `postgresql://tavuilu:tavuilu@localhost:5432/tavuilu`
