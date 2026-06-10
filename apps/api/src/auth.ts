import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { anonymous } from 'better-auth/plugins'
import { prisma } from './lib/prisma.js'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  plugins: [
    anonymous({
      // Registration always creates a new User row (better-auth's design); migrate the
      // anonymous user's Progress row to it before the old anonymous user is deleted,
      // so progress survives the guest-to-account upgrade.
      //
      // This hook also fires when an anonymous session logs into an *existing* account
      // (better-auth links the session to whatever new session was created). In that
      // case newUser already has its own Progress row, so the reassignment below would
      // violate the unique constraint on userId — and per the "no merge" login flow,
      // the existing account's progress is canonical anyway, so just leave it as is.
      // The anonymous user's Progress row is cascade-deleted when better-auth removes
      // the anonymous user.
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        const existing = await prisma.progress.findUnique({
          where: { userId: newUser.user.id },
        })
        if (existing) return

        await prisma.progress.updateMany({
          where: { userId: anonymousUser.user.id },
          data: { userId: newUser.user.id },
        })
      },
    }),
  ],
  trustedOrigins: [process.env.CORS_ORIGIN ?? 'http://localhost:5173'],
})
