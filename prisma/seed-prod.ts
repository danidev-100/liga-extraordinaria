import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

const pool = process.env.VERCEL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "1234",
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || "liga-extraordinaria",
    })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ── Helpers ────────────────────────────────────────────────────────────────

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Data ───────────────────────────────────────────────────────────────────

const LIGAS = [
  { name: "Supercampeones", slug: "supercampeones", desc: "La liga de los verdaderos campeones" },
  { name: "Champions League", slug: "champions-league", desc: "La élite del fútbol mundial" },
  { name: "Liga Extraterrestre", slug: "liga-extraterrestre", desc: "Fútbol de otro planeta" },
]

const CATEGORIAS = [
  { name: "+30", minAge: 30, maxAge: 39 },
  { name: "+40", minAge: 40, maxAge: 49 },
  { name: "+50", minAge: 50, maxAge: 99 },
]

const EQUIPOS = [
  { name: "Club Atlético River Plate", short: "River", color: "#E40000" },
  { name: "Club Atlético Boca Juniors", short: "Boca", color: "#03418C" },
  { name: "Club Atlético Independiente", short: "Independiente", color: "#DA291C" },
  { name: "Club Atlético Racing Club", short: "Racing", color: "#7BB7E0" },
  { name: "Club Atlético San Lorenzo", short: "San Lorenzo", color: "#0C1C3B" },
  { name: "Club Atlético Huracán", short: "Huracán", color: "#FF6600" },
  { name: "Club Atlético Vélez Sarsfield", short: "Vélez", color: "#006EB8" },
  { name: "Club Estudiantes La Plata", short: "Estudiantes", color: "#DD0F27" },
  { name: "Club Gimnasia La Plata", short: "Gimnasia", color: "#0F4C3A" },
  { name: "Club Atlético Rosario Central", short: "Central", color: "#000080" },
  { name: "Club Atlético Talleres", short: "Talleres", color: "#007B4B" },
  { name: "Club Atlético Belgrano", short: "Belgrano", color: "#1A5276" },
]

const NOMBRES = [
  "Santiago", "Mateo", "Lautaro", "Thiago", "Benjamín", "Santino", "Joaquín",
  "Felipe", "Bruno", "Valentino", "Bautista", "Francisco", "Ignacio", "Tomás",
  "Agustín", "Luciano", "Manuel", "Franco", "Facundo", "Nicolás", "Lucas",
  "Marcos", "Kevin", "Alan", "David", "Cristian", "Federico", "Leandro",
  "Pablo", "Diego", "Ezequiel", "Maximiliano", "Fernando", "Rodrigo", "Enzo",
  "Brian", "Hernán", "Jorge", "Nahuel", "Sergio", "Mauro", "Gastón", "Ángel",
  "Martín", "Emanuel", "Leonardo", "Iván", "Raúl", "Gonzalo", "Matías",
  "Lorenzo", "Simón", "Pedro", "Julián", "Renzo", "Alexis", "Gabriel",
  "Máximo", "Tiago", "Axel", "Valentín", "Lisandro", "Daniel", "Alejandro",
  "Ramiro", "Ulises", "Emiliano", "Jerónimo", "Damian", "Hugo", "Oscar",
]

const APELLIDOS = [
  "González", "Rodríguez", "Martínez", "Fernández", "López", "Díaz", "Torres",
  "Álvarez", "Romero", "Sosa", "Castillo", "Pereyra", "Gutiérrez", "Mendoza",
  "Rivas", "Acosta", "Medina", "Suárez", "Correa", "Navarro", "Silva", "Paz",
  "Herrera", "Domínguez", "Peralta", "Moreno", "Vega", "Campos", "Ríos",
  "Ortiz", "Molina", "Roldán", "Aguirre", "Morales", "Castro", "Flores",
  "Reyes", "Peña", "Delgado", "Cruz", "Giménez", "Cabrera", "Arias", "Rojas",
  "Vázquez", "Ramos", "Benítez", "Godoy", "Luna", "Funes", "Moyano",
  "Quiroga", "Ledesma", "Soria", "Barrios", "Toledo", "Sánchez", "Escobar",
  "Bustos", "Cardozo", "Leiva", "Salinas", "Lucero", "Méndez", "Vera",
  "Aguero", "Messi", "DiMaria", "Mascherano", "Tevez", "Riquelme", "Aimar",
]

const CANCHAS = [
  { name: "Estadio Monumental", address: "Av. Figueroa Alcorta 7597", city: "CABA" },
  { name: "Estadio La Bombonera", address: "Brandsen 805", city: "CABA" },
  { name: "Estadio Libertadores de América", address: "Av. Boedo 871", city: "Avellaneda" },
  { name: "Estadio Presidente Perón", address: "Av. Bartolomé Mitre 100", city: "Avellaneda" },
  { name: "Estadio Pedro Bidegain", address: "Av. La Plata 1700", city: "CABA" },
  { name: "Estadio Tomás A. Ducó", address: "Av. Amancio Alcorta 2520", city: "CABA" },
  { name: "Estadio José Amalfitani", address: "Av. Juan B. Justo 9200", city: "CABA" },
  { name: "Estadio UNO", address: "Calle 1 y 57", city: "La Plata" },
  { name: "Estadio Gigante de Arroyito", address: "Av. Genova 1150", city: "Rosario" },
  { name: "Estadio Mario Alberto Kempes", address: "Av. Cárcano s/n", city: "Córdoba" },
  { name: "Estadio Gigante de Alberdi", address: "Av. La Madrid 655", city: "Córdoba" },
  { name: "Estadio Centenario", address: "Av. Agraciada s/n", city: "Montevideo" },
]

// ── Fixture generator (Round-robin) ────────────────────────────────────────

function generateFixture(teamCount: number): [number, number][] {
  const teams = Array.from({ length: teamCount }, (_, i) => i)
  const rounds: [number, number][] = []
  const totalRounds = teamCount - 1
  const half = teamCount / 2

  for (let round = 0; round < totalRounds; round++) {
    for (let match = 0; match < half; match++) {
      const home = (round + match) % (teamCount - 1)
      const away = (teamCount - 1 - match + round) % (teamCount - 1)
      const actualHome = match === 0 ? teamCount - 1 : home
      const actualAway = match === 0 ? (round + teamCount - 1) % (teamCount - 1) : away
      rounds.push([actualHome, actualAway])
    }
  }
  return [...rounds, ...rounds.map(([h, a]) => [a, h] as [number, number])]
}

// ── Admin ──────────────────────────────────────────────────────────────────

async function createAdmins() {
  const passwordHash = await bcrypt.hash("admin123", 10)

  const superAdmin =
    (await prisma.admin.findUnique({ where: { email: "super@liga.com" } })) ??
    (await prisma.admin.create({
      data: { name: "Super Admin", email: "super@liga.com", passwordHash, role: "SUPER_ADMIN" },
    }))

  const admins = await Promise.all(
    LIGAS.map((l) =>
      prisma.admin.upsert({
        where: { email: `admin-${l.slug}@liga.com` },
        update: { name: `Admin ${l.name}` },
        create: {
          name: `Admin ${l.name}`,
          email: `admin-${l.slug}@liga.com`,
          passwordHash,
          role: "ADMIN",
        },
      })
    )
  )

  return { superAdmin, admins }
}

// ── League seeding ────────────────────────────────────────────────────────

async function seedLeague(
  liga: (typeof LIGAS)[number],
  adminId: string,
  courts: { id: string }[]
) {
  console.log(`\n🏆 ${liga.name}`)

  const league = await prisma.league.create({
    data: {
      name: liga.name,
      slug: liga.slug,
      season: "2026",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-11-30"),
      isActive: true,
    },
  })

  // Assign admin to league
  await prisma.admin.update({ where: { id: adminId }, data: { leagueId: league.id } })

  console.log(`  Liga creada: ${league.name}`)

  for (const catDef of CATEGORIAS) {
    console.log(`\n  📂 ${catDef.name}`)

    const category = await prisma.category.create({
      data: {
        name: catDef.name,
        minAge: catDef.minAge,
        maxAge: catDef.maxAge,
        leagueId: league.id,
      },
    })

    // Pick 6 shuffled teams for this category
    const pickedTeams = shuffle(EQUIPOS).slice(0, 6)
    const teams: { id: string; shortName: string }[] = []
    let dniBase = 30000000 + LIGAS.indexOf(liga) * 100000 + CATEGORIAS.indexOf(catDef) * 10000

    for (const eq of pickedTeams) {
      const team = await prisma.team.create({
        data: { name: eq.name, shortName: eq.short, color: eq.color, categoryId: category.id },
      })
      teams.push({ id: team.id, shortName: eq.short })

      const shuffledNames = shuffle(NOMBRES)
      const shuffledApellidos = shuffle(APELLIDOS)
      const players = Array.from({ length: 13 }, (_, i) => ({
        name: shuffledNames[i % shuffledNames.length],
        surname: shuffledApellidos[i % shuffledApellidos.length],
        dni: String(dniBase + i),
        birthDate: new Date(randomInt(1970, 1995), randomInt(0, 11), randomInt(1, 28)),
        jerseyNumber: i + 1,
        teamId: team.id,
        isActive: true,
      }))
      dniBase += 100

      await prisma.player.createMany({ data: players })
      console.log(`    ✓ ${eq.short}: ${players.length} jugadores`)
    }

    // Generate matches (round-robin ida + vuelta)
    const fixture = generateFixture(teams.length)
    const rounds = fixture.length / (teams.length / 2)

    const allPlayers = await prisma.player.findMany({
      where: { team: { categoryId: category.id } },
      select: { id: true, teamId: true },
    })
    const playersByTeam = new Map<string, string[]>()
    for (const p of allPlayers) {
      if (!playersByTeam.has(p.teamId)) playersByTeam.set(p.teamId, [])
      playersByTeam.get(p.teamId)!.push(p.id)
    }

    const matchStartDate = new Date("2026-03-15")

    for (let r = 0; r < rounds; r++) {
      const roundDate = new Date(matchStartDate)
      roundDate.setDate(roundDate.getDate() + r * 7)

      for (let m = 0; m < teams.length / 2; m++) {
        const fixtureIdx = r * (teams.length / 2) + m
        const [homeIdx, awayIdx] = fixture[fixtureIdx]
        const homeTeam = teams[homeIdx]
        const awayTeam = teams[awayIdx]

        const homeGoals = randomInt(0, 5)
        const awayGoals = randomInt(0, 4)
        const totalGoals = homeGoals + awayGoals

        const match = await prisma.match.create({
          data: {
            categoryId: category.id,
            localTeamId: homeTeam.id,
            visitorTeamId: awayTeam.id,
            courtId: pick(courts).id,
            date: new Date(roundDate.getFullYear(), roundDate.getMonth(), roundDate.getDate()),
            time: `${randomInt(14, 22)}:00`,
            round: r + 1,
            status: "FINISHED",
            localScore: homeGoals,
            visitorScore: awayGoals,
          },
        })

        // Goals
        const homePool = playersByTeam.get(homeTeam.id)!
        const awayPool = playersByTeam.get(awayTeam.id)!
        const goalData: any[] = []

        for (let g = 0; g < homeGoals; g++) {
          goalData.push({
            matchId: match.id,
            playerId: pick(homePool),
            teamId: homeTeam.id,
            minute: randomInt(1, 90),
            isOwnGoal: false,
          })
        }
        for (let g = 0; g < awayGoals; g++) {
          goalData.push({
            matchId: match.id,
            playerId: pick(awayPool),
            teamId: awayTeam.id,
            minute: randomInt(1, 90),
            isOwnGoal: false,
          })
        }
        if (goalData.length > 0) {
          await prisma.goal.createMany({ data: goalData })
        }

        // Cards (0-3 per match, 60% chance)
        const cardCount = Math.random() < 0.6 ? randomInt(0, 3) : 0
        if (cardCount > 0) {
          const cardData: any[] = []
          for (let c = 0; c < cardCount; c++) {
            const isRed = Math.random() < 0.12
            const cardTeam = Math.random() < 0.5 ? homeTeam : awayTeam
            const cardPool = cardTeam.id === homeTeam.id ? homePool : awayPool
            cardData.push({
              matchId: match.id,
              playerId: pick(cardPool),
              teamId: cardTeam.id,
              type: isRed ? "RED" : "YELLOW",
              minute: randomInt(10, 90),
              isSecondYellow: false,
            })
          }
          await prisma.card.createMany({ data: cardData })
        }
      }
    }
    console.log(`    ⚽ ${fixture.length} partidos generados`)

    // Standings calculation
    const allMatches = await prisma.match.findMany({
      where: { categoryId: category.id, status: "FINISHED" },
      select: { localTeamId: true, visitorTeamId: true, localScore: true, visitorScore: true },
    })
    const allCards = await prisma.card.findMany({
      where: { match: { categoryId: category.id, status: "FINISHED" } },
      select: { teamId: true, type: true },
    })

    const stats = new Map<
      string,
      { pj: number; pg: number; pe: number; pp: number; gf: number; gc: number; ta: number; tr: number }
    >()
    for (const t of teams) {
      stats.set(t.id, { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, ta: 0, tr: 0 })
    }

    for (const m of allMatches) {
      const home = stats.get(m.localTeamId)!
      const away = stats.get(m.visitorTeamId)!
      if (m.localScore === null || m.visitorScore === null) continue
      home.pj++
      away.pj++
      home.gf += m.localScore
      home.gc += m.visitorScore
      away.gf += m.visitorScore
      away.gc += m.localScore
      if (m.localScore > m.visitorScore) {
        home.pg++
        away.pp++
      } else if (m.localScore < m.visitorScore) {
        away.pg++
        home.pp++
      } else {
        home.pe++
        away.pe++
      }
    }

    for (const card of allCards) {
      const team = stats.get(card.teamId)
      if (!team) continue
      if (card.type === "YELLOW") team.ta++
      else team.tr++
    }

    const standingData = Array.from(stats.entries())
      .map(([teamId, s]) => ({
        categoryId: category.id,
        teamId,
        pts: s.pg * 3 + s.pe,
        pj: s.pj,
        pg: s.pg,
        pe: s.pe,
        pp: s.pp,
        gf: s.gf,
        gc: s.gc,
        dg: s.gf - s.gc,
        ta: s.ta,
        tr: s.tr,
      }))
      .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf)
      .map((s, i) => ({ ...s, position: i + 1 }))

    await prisma.standing.createMany({ data: standingData })
    console.log(`    📊 Posiciones calculadas`)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding production demo...\n")

  // Clean data (preserve admins)
  console.log("🧹 Cleaning data...")
  await prisma.standing.deleteMany()
  await prisma.card.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.match.deleteMany()
  await prisma.player.deleteMany()
  await prisma.team.deleteMany()
  await prisma.court.deleteMany()
  await prisma.category.deleteMany()
  await prisma.league.deleteMany()
  // Reset leagueId on admins so they can be reassigned
  await prisma.admin.updateMany({ where: { role: "ADMIN" }, data: { leagueId: null } })
  console.log("  Done (admins preserved)\n")

  // Create courts (shared across all leagues)
  await prisma.court.createMany({ data: CANCHAS })
  const courts = await prisma.court.findMany()
  console.log(`✅ ${courts.length} canchas creadas\n`)

  // Create admins
  const { superAdmin, admins } = await createAdmins()
  console.log(`✅ Super Admin: super@liga.com / admin123`)
  admins.forEach((a, i) => console.log(`   Admin ${LIGAS[i].name}: ${a.email} / admin123`))
  console.log()

  // Seed each league
  for (let i = 0; i < LIGAS.length; i++) {
    await seedLeague(LIGAS[i], admins[i].id, courts)
  }

  // ── Summary ────────────────────────────────────────────────────────────
  const summary = await Promise.all([
    prisma.league.count(),
    prisma.category.count(),
    prisma.team.count(),
    prisma.player.count(),
    prisma.match.count(),
    prisma.goal.count(),
    prisma.card.count(),
    prisma.court.count(),
  ])

  console.log("\n" + "=".repeat(50))
  console.log("✅✅✅ SEED COMPLETADO")
  console.log("=".repeat(50))
  console.log(`  Ligas:      ${summary[0]}`)
  console.log(`  Categorías: ${summary[1]}`)
  console.log(`  Equipos:    ${summary[2]}`)
  console.log(`  Jugadores:  ${summary[3]}`)
  console.log(`  Partidos:   ${summary[4]}`)
  console.log(`  Goles:      ${summary[5]}`)
  console.log(`  Tarjetas:   ${summary[6]}`)
  console.log(`  Canchas:    ${summary[7]}`)
  console.log("=".repeat(50))
  console.log("\n🔑 Accesos:")
  console.log("   SUPER_ADMIN: super@liga.com / admin123")
  LIGAS.forEach((l, i) => console.log(`   Admin ${l.name}: admin-${l.slug}@liga.com / admin123`))
  console.log()
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
