import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

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
  { name: "Supercampeones", slug: "supercampeones" },
  { name: "Champions League", slug: "champions-league" },
  { name: "Liga Extraterrestre", slug: "liga-extraterrestre" },
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

// ── Prisma client for the API ─────────────────────────────────────────────

function getPrisma() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

// ── Seed logic ─────────────────────────────────────────────────────────────

async function seed() {
  const prisma = getPrisma()

  // Clean
  await prisma.standing.deleteMany()
  await prisma.card.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.match.deleteMany()
  await prisma.player.deleteMany()
  await prisma.team.deleteMany()
  await prisma.court.deleteMany()
  await prisma.category.deleteMany()
  await prisma.league.deleteMany()
  await prisma.admin.updateMany({ where: { role: "ADMIN" }, data: { leagueId: null } })

  // Courts
  await prisma.court.createMany({ data: CANCHAS })
  const courts = await prisma.court.findMany()

  // Admins
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

  // Seed each league
  for (let i = 0; i < LIGAS.length; i++) {
    const liga = LIGAS[i]
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
    await prisma.admin.update({ where: { id: admins[i].id }, data: { leagueId: league.id } })

    for (const catDef of CATEGORIAS) {
      const category = await prisma.category.create({
        data: { name: catDef.name, minAge: catDef.minAge, maxAge: catDef.maxAge, leagueId: league.id },
      })

      const pickedTeams = shuffle(EQUIPOS).slice(0, 6)
      const teams: { id: string; shortName: string }[] = []
      let dniBase = 30000000 + i * 100000 + CATEGORIAS.indexOf(catDef) * 10000

      for (const eq of pickedTeams) {
        const team = await prisma.team.create({
          data: { name: eq.name, shortName: eq.short, color: eq.color, categoryId: category.id },
        })
        teams.push({ id: team.id, shortName: eq.short })
        const shuffledNames = shuffle(NOMBRES)
        const shuffledApellidos = shuffle(APELLIDOS)
        await prisma.player.createMany({
          data: Array.from({ length: 13 }, (_, j) => ({
            name: shuffledNames[j % shuffledNames.length],
            surname: shuffledApellidos[j % shuffledApellidos.length],
            dni: String(dniBase + j),
            birthDate: new Date(randomInt(1970, 1995), randomInt(0, 11), randomInt(1, 28)),
            jerseyNumber: j + 1,
            teamId: team.id,
            isActive: true,
          })),
        })
        dniBase += 100
      }

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

          const homePool = playersByTeam.get(homeTeam.id)!
          const awayPool = playersByTeam.get(awayTeam.id)!
          const goals: any[] = []
          for (let g = 0; g < homeGoals; g++) {
            goals.push({ matchId: match.id, playerId: pick(homePool), teamId: homeTeam.id, minute: randomInt(1, 90), isOwnGoal: false })
          }
          for (let g = 0; g < awayGoals; g++) {
            goals.push({ matchId: match.id, playerId: pick(awayPool), teamId: awayTeam.id, minute: randomInt(1, 90), isOwnGoal: false })
          }
          if (goals.length > 0) await prisma.goal.createMany({ data: goals })

          const cardCount = Math.random() < 0.6 ? randomInt(0, 3) : 0
          if (cardCount > 0) {
            const cards: any[] = []
            for (let c = 0; c < cardCount; c++) {
              const isRed = Math.random() < 0.12
              const cardTeam = Math.random() < 0.5 ? homeTeam : awayTeam
              const cardPool = cardTeam.id === homeTeam.id ? homePool : awayPool
              cards.push({
                matchId: match.id,
                playerId: pick(cardPool),
                teamId: cardTeam.id,
                type: isRed ? "RED" : "YELLOW",
                minute: randomInt(10, 90),
                isSecondYellow: false,
              })
            }
            await prisma.card.createMany({ data: cards })
          }
        }
      }

      // Standings
      const allMatches = await prisma.match.findMany({
        where: { categoryId: category.id, status: "FINISHED" },
        select: { localTeamId: true, visitorTeamId: true, localScore: true, visitorScore: true },
      })
      const allCards = await prisma.card.findMany({
        where: { match: { categoryId: category.id, status: "FINISHED" } },
        select: { teamId: true, type: true },
      })

      const stats = new Map<string, any>()
      for (const t of teams) {
        stats.set(t.id, { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, ta: 0, tr: 0 })
      }
      for (const m of allMatches) {
        const home = stats.get(m.localTeamId)
        const away = stats.get(m.visitorTeamId)
        if (!home || !away || m.localScore === null || m.visitorScore === null) continue
        home.pj++; away.pj++
        home.gf += m.localScore; home.gc += m.visitorScore
        away.gf += m.visitorScore; away.gc += m.localScore
        if (m.localScore > m.visitorScore) { home.pg++; away.pp++ }
        else if (m.localScore < m.visitorScore) { away.pg++; home.pp++ }
        else { home.pe++; away.pe++ }
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
          pj: s.pj, pg: s.pg, pe: s.pe, pp: s.pp,
          gf: s.gf, gc: s.gc, dg: s.gf - s.gc,
          ta: s.ta, tr: s.tr,
        }))
        .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf)
        .map((s, i) => ({ ...s, position: i + 1 }))
      await prisma.standing.createMany({ data: standingData })
    }
  }

  await prisma.$disconnect()
  return { superAdmin: superAdmin.email, admins: admins.map((a) => a.email) }
}

// ── API handler ────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Auth check via query param for production bootstrap
  const url = new URL(request.url)
  const token = url.searchParams.get("token")

  if (token !== "seed-liga-2026") {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado. Solo SUPER_ADMIN." }, { status: 403 })
    }
  }

  try {
    const result = await seed()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json({ error: "Error al ejecutar seed" }, { status: 500 })
  }
}
