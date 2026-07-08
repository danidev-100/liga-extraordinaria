import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  // @prisma/adapter-pg uses the `pg` driver which has SCRAM auth issues with
  // local PostgreSQL. Only use it on Vercel (Neon), standard client elsewhere.
  if (process.env.VERCEL) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    })
    return new PrismaClient({ adapter })
  }
  return new PrismaClient()
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
