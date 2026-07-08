import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
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

const EQUIPOS = [
  { name: 'Club Atlético River Plate', short: 'River', color: '#E40000' },
  { name: 'Club Atlético Boca Juniors', short: 'Boca', color: '#03418C' },
  { name: 'Club Atlético Independiente', short: 'Independiente', color: '#DA291C' },
  { name: 'Club Atlético Racing Club', short: 'Racing', color: '#7BB7E0' },
  { name: 'Club Atlético San Lorenzo', short: 'San Lorenzo', color: '#0C1C3B' },
  { name: 'Club Atlético Huracán', short: 'Huracán', color: '#FF6600' },
  { name: 'Club Atlético Vélez Sarsfield', short: 'Vélez', color: '#006EB8' },
  { name: 'Club Estudiantes La Plata', short: 'Estudiantes', color: '#DD0F27' },
  { name: 'Club Gimnasia La Plata', short: 'Gimnasia', color: '#0F4C3A' },
  { name: 'Club Atlético Rosario Central', short: 'Central', color: '#000080' },
]

const NOMBRES = [
  'Santiago', 'Mateo', 'Lautaro', 'Thiago', 'Benjamín', 'Santino', 'Joaquín',
  'Felipe', 'Bruno', 'Valentino', 'Bautista', 'Francisco', 'Ignacio', 'Tomás',
  'Agustín', 'Luciano', 'Manuel', 'Franco', 'Facundo', 'Nicolás', 'Lucas',
  'Marcos', 'Kevin', 'Alan', 'David', 'Cristian', 'Federico', 'Leandro',
  'Pablo', 'Diego', 'Ezequiel', 'Maximiliano', 'Fernando', 'Rodrigo', 'Enzo',
  'Brian', 'Hernán', 'Jorge', 'Nahuel', 'Sergio', 'Mauro', 'Gastón', 'Ángel',
  'Martín', 'Emanuel', 'Leonardo', 'Iván', 'Raúl', 'Gonzalo', 'Matías',
  'Lorenzo', 'Simón', 'Pedro', 'Julián', 'Renzo', 'Alexis', 'Gabriel',
  'Máximo', 'Tiago', 'Axel', 'Valentín', 'Lisandro', 'Daniel', 'Alejandro',
]

const APELLIDOS = [
  'González', 'Rodríguez', 'Martínez', 'Fernández', 'López', 'Díaz', 'Torres',
  'Álvarez', 'Romero', 'Sosa', 'Castillo', 'Pereyra', 'Gutiérrez', 'Mendoza',
  'Rivas', 'Acosta', 'Medina', 'Suárez', 'Correa', 'Navarro', 'Silva', 'Paz',
  'Herrera', 'Domínguez', 'Peralta', 'Moreno', 'Vega', 'Campos', 'Ríos',
  'Ortiz', 'Molina', 'Roldán', 'Aguirre', 'Morales', 'Castro', 'Flores',
  'Reyes', 'Peña', 'Delgado', 'Cruz', 'Giménez', 'Cabrera', 'Arias', 'Rojas',
  'Vázquez', 'Ramos', 'Benítez', 'Godoy', 'Luna', 'Funes', 'Moyano',
  'Quiroga', 'Ledesma', 'Soria', 'Barrios', 'Toledo', 'Sánchez', 'Escobar',
  'Bustos', 'Cardozo', 'Leiva', 'Salinas', 'Lucero', 'Méndez', 'Vera',
]

const CANCHAS = [
  { name: 'Estadio Monumental', address: 'Av. Figueroa Alcorta 7597', city: 'CABA' },
  { name: 'Estadio La Bombonera', address: 'Brandsen 805', city: 'CABA' },
  { name: 'Estadio Libertadores de América', address: 'Av. Boedo 871', city: 'Avellaneda' },
  { name: 'Estadio Presidente Perón', address: 'Av. Bartolomé Mitre 100', city: 'Avellaneda' },
  { name: 'Estadio Pedro Bidegain', address: 'Av. La Plata 1700', city: 'CABA' },
  { name: 'Estadio Tomás A. Ducó', address: 'Av. Amancio Alcorta 2520', city: 'CABA' },
  { name: 'Estadio José Amalfitani', address: 'Av. Juan B. Justo 9200', city: 'CABA' },
  { name: 'Estadio UNO', address: 'Calle 1 y 57', city: 'La Plata' },
  { name: 'Estadio Juan C. Zerrillo', address: 'Calle 4 y 71', city: 'La Plata' },
  { name: 'Estadio Gigante de Arroyito', address: 'Av. Genova 1150', city: 'Rosario' },
]

// ── Fixture generator (Round-robin) ────────────────────────────────────────

function generateFixture(teamCount: number): [number, number][] {
  // Round-robin algorithm (circle method)
  const teams = Array.from({ length: teamCount }, (_, i) => i)
  const rounds: [number, number][] = []
  const totalRounds = teamCount - 1
  const half = teamCount / 2

  for (let round = 0; round < totalRounds; round++) {
    for (let match = 0; match < half; match++) {
      const home = (round + match) % (teamCount - 1)
      const away = (teamCount - 1 - match + round) % (teamCount - 1)
      // Last team stays fixed
      const actualHome = match === 0 ? teamCount - 1 : home
      const actualAway = match === 0 ? (round + teamCount - 1) % (teamCount - 1) : away
      rounds.push([actualHome, actualAway])
    }
  }

  // Return fixture (ida + vuelta)
  return [...rounds, ...rounds.map(([h, a]) => [a, h] as [number, number])]
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding demo liga with 10 equipos, partidos completos...\n')

  // Clean
  console.log('🧹 Cleaning...')
  await prisma.standing.deleteMany()
  await prisma.card.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.match.deleteMany()
  await prisma.player.deleteMany()
  await prisma.team.deleteMany()
  await prisma.court.deleteMany()
  await prisma.category.deleteMany()
  await prisma.league.deleteMany()
  await prisma.admin.deleteMany()
  console.log('✓ Done\n')

  // 1. Admin
  const passwordHash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.admin.create({
    data: { name: 'Admin', email: 'admin@liga.com', passwordHash, role: 'SUPER_ADMIN' },
  })
  console.log(`✓ Admin: ${admin.email} / admin123\n`)

  // 2. League
  const league = await prisma.league.create({
    data: {
      name: 'Liga Extraordinaria 2026',
      slug: 'liga-extraordinaria-2026',
      season: '2026',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-11-30'),
      isActive: true,
    },
  })
  console.log(`✓ League: ${league.name}\n`)

  // 3. Category
  const category = await prisma.category.create({
    data: { name: 'Primera División', minAge: 16, maxAge: 99, leagueId: league.id },
  })
  console.log(`✓ Category: ${category.name}\n`)

  // 4. Courts
  await prisma.court.createMany({ data: CANCHAS })
  const courts = await prisma.court.findMany()
  console.log(`✓ Courts: ${courts.length}\n`)

  // 5. Teams + Players
  const teams: { id: string; shortName: string }[] = []
  let dniBase = 30000000

  for (const eq of EQUIPOS) {
    const team = await prisma.team.create({
      data: { name: eq.name, shortName: eq.short, color: eq.color, categoryId: category.id },
    })
    teams.push({ id: team.id, shortName: eq.short })

    // 15 jugadores por equipo
    const shuffledNames = shuffle(NOMBRES)
    const shuffledApellidos = shuffle(APELLIDOS)
    const players = Array.from({ length: 15 }, (_, i) => ({
      name: shuffledNames[i % shuffledNames.length],
      surname: shuffledApellidos[i % shuffledApellidos.length],
      dni: String(dniBase + i),
      birthDate: new Date(randomInt(1990, 2005), randomInt(0, 11), randomInt(1, 28)),
      jerseyNumber: i + 1,
      teamId: team.id,
      isActive: true,
    }))
    dniBase += 100

    await prisma.player.createMany({ data: players })
    console.log(`  ✓ ${eq.short}: 15 jugadores`)
  }
  console.log(`\n✅ ${teams.length} equipos, 150 jugadores\n`)

  // 6. Generate matches (round-robin ida + vuelta = 18 fechas)
  const fixture = generateFixture(teams.length)
  const rounds = fixture.length / (teams.length / 2) // = 18

  const matchStartDate = new Date('2026-03-15')
  const allPlayers = await prisma.player.findMany({ select: { id: true, teamId: true } })
  const playersByTeam = new Map<string, string[]>()
  for (const p of allPlayers) {
    if (!playersByTeam.has(p.teamId)) playersByTeam.set(p.teamId, [])
    playersByTeam.get(p.teamId)!.push(p.id)
  }

  console.log('⚽ Generando partidos...\n')

  for (let r = 0; r < rounds; r++) {
    const roundDate = new Date(matchStartDate)
    roundDate.setDate(roundDate.getDate() + r * 7) // cada fecha es una semana después

    const matchDay = roundDate.getDate()
    const matchMonth = roundDate.getMonth()
    const matchYear = roundDate.getFullYear()

    for (let m = 0; m < teams.length / 2; m++) {
      const fixtureIdx = r * (teams.length / 2) + m
      const [homeIdx, awayIdx] = fixture[fixtureIdx]
      const homeTeam = teams[homeIdx]
      const awayTeam = teams[awayIdx]

      // Simular resultado
      const homeGoals = randomInt(0, 5)
      const awayGoals = randomInt(0, 4)
      const totalGoals = homeGoals + awayGoals

      const match = await prisma.match.create({
        data: {
          categoryId: category.id,
          localTeamId: homeTeam.id,
          visitorTeamId: awayTeam.id,
          courtId: pick(courts).id,
          date: new Date(matchYear, matchMonth, matchDay),
          time: `${randomInt(14, 22)}:00`,
          round: r + 1,
          status: 'FINISHED',
          localScore: homeGoals,
          visitorScore: awayGoals,
        },
      })

      // Generar goles
      const goalData: { matchId: string; playerId: string; teamId: string; minute: number; isOwnGoal: boolean }[] = []
      const homePlayers = playersByTeam.get(homeTeam.id)!
      const awayPlayers = playersByTeam.get(awayTeam.id)!

      for (let g = 0; g < totalGoals; g++) {
        const isOwn = Math.random() < 0.08 // 8% own goal probability
        const scorerTeam = g < homeGoals ? homeTeam : awayTeam
        const scorerPool = g < homeGoals ? homePlayers : awayPlayers
        const playerId = pick(scorerPool)
        goalData.push({
          matchId: match.id,
          playerId,
          teamId: isOwn ? (scorerTeam.id === homeTeam.id ? awayTeam.id : homeTeam.id) : scorerTeam.id,
          minute: randomInt(1, 90),
          isOwnGoal: isOwn,
        })
      }

      if (goalData.length > 0) {
        await prisma.goal.createMany({ data: goalData })
      }

      // Generar tarjetas (aleatorio, 0-4 por partido)
      const cardCount = Math.random() < 0.7 ? randomInt(0, 4) : 0
      if (cardCount > 0) {
        const cardData: { matchId: string; playerId: string; teamId: string; type: 'YELLOW' | 'RED'; minute: number; isSecondYellow: boolean }[] = []
        for (let c = 0; c < cardCount; c++) {
          const isRed = Math.random() < 0.15
          const cardTeam = Math.random() < 0.5 ? homeTeam : awayTeam
          const cardPool = cardTeam.id === homeTeam.id ? homePlayers : awayPlayers
          cardData.push({
            matchId: match.id,
            playerId: pick(cardPool),
            teamId: cardTeam.id,
            type: isRed ? 'RED' : 'YELLOW',
            minute: randomInt(10, 90),
            isSecondYellow: false,
          })
        }
        await prisma.card.createMany({ data: cardData })
      }
    }
    console.log(`  ✓ Fecha ${r + 1}: ${teams.length / 2} partidos`)
  }

  console.log(`\n✅ ${fixture.length} partidos generados`)

  // 7. Recalcular posiciones
  console.log('\n📊 Calculando posiciones...')

  const allMatches = await prisma.match.findMany({
    where: { categoryId: category.id, status: 'FINISHED' },
    select: { localTeamId: true, visitorTeamId: true, localScore: true, visitorScore: true },
  })

  const allCards = await prisma.card.findMany({
    where: { match: { categoryId: category.id, status: 'FINISHED' } },
    select: { teamId: true, type: true },
  })

  // Calcular standings manualmente
  const stats = new Map<string, { pj: number; pg: number; pe: number; pp: number; gf: number; gc: number; ta: number; tr: number }>()

  for (const t of teams) {
    stats.set(t.id, { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, ta: 0, tr: 0 })
  }

  for (const match of allMatches) {
    const home = stats.get(match.localTeamId)!
    const away = stats.get(match.visitorTeamId)!

    if (match.localScore === null || match.visitorScore === null) continue

    home.pj++
    away.pj++
    home.gf += match.localScore
    home.gc += match.visitorScore
    away.gf += match.visitorScore
    away.gc += match.localScore

    if (match.localScore > match.visitorScore) {
      home.pg++
      away.pp++
    } else if (match.localScore < match.visitorScore) {
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
    if (card.type === 'YELLOW') team.ta++
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

  // Asignar posiciones
  const finalStandings = standingData.map((s, i) => ({
    ...s,
    position: i + 1,
  }))

  await prisma.standing.createMany({ data: finalStandings })

  console.log('✅ Posiciones calculadas\n')
  console.log('┌─────────┬─────┬────┬────┬────┬────┬────┬────┬────┬────┐')
  console.log('│ Equipo  │ Pts │ PJ │ PG │ PE │ PP │ GF │ GC │ DG │ TA │')
  console.log('├─────────┼─────┼────┼────┼────┼────┼────┼────┼────┼────┤')
  for (const s of finalStandings) {
    const team = teams.find((t) => t.id === s.teamId)
    console.log(
      `│ ${(team?.shortName ?? '??').padEnd(7)} │ ${String(s.pts).padStart(3)} │ ${String(s.pj).padStart(2)} │ ${String(s.pg).padStart(2)} │ ${String(s.pe).padStart(2)} │ ${String(s.pp).padStart(2)} │ ${String(s.gf).padStart(2)} │ ${String(s.gc).padStart(2)} │ ${String(s.dg).padStart(2)} │ ${String(s.ta).padStart(2)} │`,
    )
  }
  console.log('└─────────┴─────┴────┴────┴────┴────┴────┴────┴────┴────┘')

  console.log('\n✅✅✅ Demo seed completado!')
  console.log(`   Admin: admin@liga.com / admin123`)
  console.log(`   Liga: ${league.slug}`)
  console.log(`   Equipos: ${teams.length}`)
  console.log(`   Partidos: ${fixture.length}`)
  console.log(`   Fechas: ${rounds}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
