/**
 * Backfill script: adds slugs to existing leagues and assigns admins to leagues.
 *
 * Safe to run on existing data:
 *  - Only updates records that have null slug or null leagueId
 *  - SUPER_ADMIN users keep leagueId = null
 *  - Idempotent: safe to run multiple times
 *
 * Usage: npx tsx scripts/backfill-slug.ts
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

async function main() {
  console.log("🔄 Backfilling slugs and league assignments...\n")

  // 1. Backfill slugs for leagues that don't have one
  const leaguesWithoutSlug = await prisma.league.findMany({
    where: { slug: null },
  })

  for (const league of leaguesWithoutSlug) {
    let slug = slugify(league.name)

    // Handle collisions
    let counter = 1
    while (await prisma.league.findUnique({ where: { slug } })) {
      slug = `${slugify(league.name)}-${counter}`
      counter++
    }

    await prisma.league.update({
      where: { id: league.id },
      data: { slug },
    })
    console.log(`  ✓ League "${league.name}" → slug: ${slug}`)
  }

  if (leaguesWithoutSlug.length === 0) {
    console.log("  ✓ All leagues already have slugs.")
  }

  // 2. Assign ADMIN users to the first league
  const firstLeague = await prisma.league.findFirst({
    orderBy: { createdAt: "asc" },
  })

  if (firstLeague) {
    const adminsWithoutLeague = await prisma.admin.findMany({
      where: {
        leagueId: null,
        role: "ADMIN",
      },
    })

    for (const admin of adminsWithoutLeague) {
      await prisma.admin.update({
        where: { id: admin.id },
        data: { leagueId: firstLeague.id },
      })
      console.log(`  ✓ Admin "${admin.email}" → assigned to league "${firstLeague.name}"`)
    }

    if (adminsWithoutLeague.length === 0) {
      console.log("  ✓ All ADMINs already have a league assignment or none exist.")
    }

    const superAdmins = await prisma.admin.findMany({
      where: { role: "SUPER_ADMIN" },
    })
    if (superAdmins.length > 0) {
      console.log(`  ✓ ${superAdmins.length} SUPER_ADMIN(s) keep leagueId = null (global access)`)
    }
  } else {
    console.log("  ⚠ No leagues found. Skipping admin assignment.")
  }

  console.log("\n✅ Backfill complete!")
}

main()
  .catch((e) => {
    console.error("❌ Backfill failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
