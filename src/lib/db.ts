import { PrismaClient } from '@prisma/client'

function createClient(): PrismaClient {
  // @prisma/adapter-pg optimizes for Neon (used in production). In local dev it
  // falls back to standard PrismaClient which works with any PostgreSQL.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaPg } = require('@prisma/adapter-pg') as typeof import('@prisma/adapter-pg')
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    })
    return new PrismaClient({ adapter })
  } catch {
    return new PrismaClient()
  }
}

const prismaClientSingleton = () => createClient()

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
