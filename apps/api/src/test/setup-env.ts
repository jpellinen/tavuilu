import path from 'node:path'

// In CI, DATABASE_URL/BETTER_AUTH_SECRET are provided as real env vars.
// For local dev, fall back to apps/api/.env (same file the Docker entrypoint uses).
try {
  process.loadEnvFile(path.resolve(import.meta.dirname, '../../.env'))
} catch {
  // .env not present — assume env vars are already set
}
