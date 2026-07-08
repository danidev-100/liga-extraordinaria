import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  const leagues = await db.league.findMany()
  console.log("Total leagues:", leagues.length)
  leagues.forEach((l) =>
    console.log("  -", l.name, "| active:", l.isActive, "| slug:", l.slug)
  )
}

main().catch(console.error).finally(() => {})
