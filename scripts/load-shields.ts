/**
 * Load team shields (logos) from public/escudos/ into the Team.logoUrl field.
 *
 * It matches each image file to one or more teams by name (case/accents/spaces
 * insensitive, plus a "compact" form so "cata50" matches "Cata 50").
 * The same club in different categories gets the same shield.
 *
 * Idempotent: teams that already have the matching logoUrl are skipped.
 *
 * Usage:
 *   pnpm shields                 -> load every escudo in public/escudos/
 *   pnpm shields --dry-run       -> preview matches without writing anything
 *   pnpm shields --only "Name"   -> load the shield for a single team/file
 *
 * To add one team later: drop the file in public/escudos/ named after the
 * team (e.g. "Andes Origen.jpeg") and re-run `pnpm shields`, or use
 * `pnpm shields --only "Andes Origen"`. The admin form also accepts local
 * paths like "/escudos/Andes Origen.jpeg".
 */

import "dotenv/config"
import { readdirSync } from "node:fs"
import path from "node:path"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = process.env.VERCEL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "1234",
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || "liga-extraordinaria",
    })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const ESCUDOS_DIR = path.join(process.cwd(), "public", "escudos")
const IMAGE_EXT = /\.(jpe?g|png|webp|svg|avif|gif)$/i

function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

function compact(name: string): string {
  return normalize(name).replace(/\s+/g, "")
}

function matchTeam(fileBase: string, teamName: string): boolean {
  const base = normalize(fileBase)
  const team = normalize(teamName)
  return base === team || compact(fileBase) === compact(teamName)
}

function parseArgs(argv: string[]) {
  return {
    dryRun: argv.includes("--dry-run"),
    only: (() => {
      const i = argv.indexOf("--only")
      return i >= 0 ? argv[i + 1] : null
    })(),
  }
}

async function main() {
  const { dryRun, only } = parseArgs(process.argv.slice(2))

  const files = readdirSync(ESCUDOS_DIR)
    .filter((f) => IMAGE_EXT.test(f))
    .sort()

  if (files.length === 0) {
    console.log("⚠ No image files found in public/escudos/")
    return
  }

  const teams = await prisma.team.findMany({ select: { id: true, name: true, logoUrl: true } })
  const byCompactName = new Map<string, typeof teams>()
  for (const t of teams) {
    const key = compact(t.name)
    if (!byCompactName.has(key)) byCompactName.set(key, [])
    byCompactName.get(key)!.push(t)
  }

  let updated = 0
  let skipped = 0
  let unmatched = 0
  const unmatchedFiles: string[] = []

  for (const file of files) {
    if (only && !matchTeam(path.parse(file).name, only)) continue

    const logoUrl = `/escudos/${file}`
    const candidates =
      byCompactName.get(compact(path.parse(file).name)) ??
      teams.filter((t) => matchTeam(path.parse(file).name, t.name))

    if (candidates.length === 0) {
      unmatched++
      unmatchedFiles.push(file)
      continue
    }

    const pending = candidates.filter((t) => t.logoUrl !== logoUrl)
    if (pending.length === 0) {
      skipped++
      console.log(`  = ${file} -> already set (${candidates.length} team(s))`)
      continue
    }

    if (dryRun) {
      console.log(`  ~ ${file} -> would set "${logoUrl}" on: ${pending.map((t) => t.name).join(", ")}`)
      continue
    }

    await prisma.team.updateMany({
      where: { id: { in: pending.map((t) => t.id) } },
      data: { logoUrl },
    })
    updated++
    console.log(`  ✓ ${file} -> "${logoUrl}" on: ${pending.map((t) => t.name).join(", ")}`)
  }

  console.log("\n── Summary ─────────────────────────────")
  console.log(`  Files in public/escudos/: ${files.length}`)
  if (dryRun) {
    console.log(`  Would update: ${updated} file(s)`)
  } else {
    console.log(`  Updated: ${updated} file(s)`)
  }
  console.log(`  Skipped (already set): ${skipped}`)
  console.log(`  No team matched: ${unmatched}`)

  if (unmatchedFiles.length > 0) {
    console.log("\n⚠ No team found for:")
    for (const f of unmatchedFiles) console.log(`   - ${f}`)
    console.log("\n  Tip: rename the file to match the team name, e.g. \"Andes Origen.jpeg\".")
    console.log("  Teams currently in DB:")
    const names = [...new Set(teams.map((t) => t.name))].sort()
    console.log("   " + names.join(" | "))
  }
}

main()
  .catch((e) => {
    console.error("❌ Load shields failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })