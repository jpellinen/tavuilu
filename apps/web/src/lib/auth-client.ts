import { createAuthClient } from 'better-auth/react'
import { anonymousClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: `${window.location.origin}/api/auth`,
  plugins: [anonymousClient()],
})
