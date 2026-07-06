import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// ── Helpers ────────────────────────────────────────────────────────────────

function year(y: number) {
  return new Date(`${y}-06-15`)
}

/** Build the full set of categories, each with 10 teams of 11 players. */
function buildAllTeams(): {
  category: { name: string; minAge: number; maxAge: number }
  teams: { name: string; shortName: string; color: string; players: ReturnType<typeof makePlayers> }[]
}[] {
  const sub12Names = [
    'Club Atlético Lanús', 'Club Atlético Banfield', 'Club Atlético Temperley',
    'Club Social y Deportivo Muñiz', 'Club Atlético Luján', 'Club Deportivo Morón',
    'Club Atlético Tigre', 'Club Atlético Platense', 'Club Atlético Quilmes',
    'Club Atlético Brown',
  ]
  const sub12Short = ['Lanús', 'Banfield', 'Temperley', 'Muñiz', 'Luján', 'Morón', 'Tigre', 'Platense', 'Quilmes', 'Brown']
  const sub12Colors = ['#8C1C1C', '#006633', '#1B3A6B', '#FF6600', '#003A70', '#A37E2C', '#CE1126', '#6C1D45', '#003DA5', '#6F2C3F']

  const sub15Names = [
    'Club Atlético Atlanta', 'Club Atlético Defensores de Belgrano', 'Club Atlético Colegiales',
    'Club Atlético Almagro', 'Club Deportivo Armenio', 'Club Atlético Acassuso',
    'Club Atlético San Telmo', 'Club Atlético Dock Sud', 'Club Atlético Ituzaingó',
    'Club Atlético Villa Crespo',
  ]
  const sub15Short = ['Atlanta', 'Defensores', 'Colegiales', 'Almagro', 'Armenio', 'Acassuso', 'San Telmo', 'Dock Sud', 'Ituzaingó', 'Villa Crespo']
  const sub15Colors = ['#FFD700', '#006633', '#8B0000', '#C41230', '#1E90FF', '#4169E1', '#DC143C', '#2E8B57', '#FF4500', '#9932CC']

  const seniorNames = [
    'Club Atlético River Plate', 'Club Atlético Boca Juniors', 'Club Atlético Independiente',
    'Club Atlético Racing Club', 'Club Atlético San Lorenzo', 'Club Atlético Huracán',
    'Club Atlético Vélez Sarsfield', 'Club Estudiantes de La Plata', 'Club Atlético Gimnasia La Plata',
    'Club Atlético Rosario Central',
  ]
  const seniorShort = ['River', 'Boca', 'Independiente', 'Racing', 'San Lorenzo', 'Huracán', 'Vélez', 'Estudiantes', 'Gimnasia', 'Central']
  const seniorColors = ['#E40000', '#03418C', '#DA291C', '#7BB7E0', '#0C1C3B', '#FF6600', '#006EB8', '#DD0F27', '#0F4C3A', '#000080']

  const categories = [
    { name: 'Sub-12', minAge: 10, maxAge: 12, names: sub12Names, shorts: sub12Short, colors: sub12Colors, yearRange: [2014, 2015] as const },
    { name: 'Sub-15', minAge: 13, maxAge: 15, names: sub15Names, shorts: sub15Short, colors: sub15Colors, yearRange: [2011, 2012] as const },
    { name: 'Senior', minAge: 16, maxAge: 99, names: seniorNames, shorts: seniorShort, colors: seniorColors, yearRange: [1993, 2002] as const },
  ]

  const nombres = [
    'Santiago', 'Mateo', 'Lautaro', 'Thiago', 'Benjamín', 'Santino', 'Joaquín', 'Felipe', 'Bruno', 'Valentino',
    'Bautista', 'Francisco', 'Ignacio', 'Tomás', 'Agustín', 'Luciano', 'Manuel', 'Franco', 'Emiliano', 'Juan',
    'Facundo', 'Nicolás', 'Lucas', 'Marcos', 'Kevin', 'Alan', 'David', 'Cristian', 'Federico', 'Leandro',
    'Pablo', 'Diego', 'Ezequiel', 'Maximiliano', 'Fernando', 'Rodrigo', 'Enzo', 'Brian', 'Hernán', 'Jorge',
    'Nahuel', 'Sergio', 'Mauro', 'Gastón', 'Ángel', 'Martín', 'Emanuel', 'Leonardo', 'Iván', 'Raúl',
    'Adrián', 'César', 'Hugo', 'Fabián', 'Gonzalo', 'Matías', 'Lorenzo', 'Simón', 'Pedro', 'Julián',
    'Renzo', 'Héctor', 'Alexis', 'Gabriel', 'Máximo', 'Tiago', 'Axel', 'Ian', 'Valentín', 'Nehuén',
    'Lisandro', 'Brian', 'Fernando', 'Rodrigo', 'Enzo', 'Daniel', 'Roberto', 'Alejandro', 'Miguel', 'Javier',
    'Carlos', 'Luis', 'Andrés', 'Esteban', 'Ramiro', 'Ulises', 'Félix', 'Ismael', 'Luciano', 'Rafael',
  ]

  const apellidos = [
    'González', 'Rodríguez', 'Martínez', 'Fernández', 'López', 'Díaz', 'Torres', 'Álvarez', 'Romero', 'Sosa',
    'Castillo', 'Pereyra', 'Gutiérrez', 'Mendoza', 'Rivas', 'Acosta', 'Medina', 'Suárez', 'Correa', 'Navarro',
    'Silva', 'Paz', 'Herrera', 'Domínguez', 'Peralta', 'Moreno', 'Vega', 'Campos', 'Ríos', 'Ortiz',
    'Molina', 'Roldán', 'Aguirre', 'Morales', 'Castro', 'Flores', 'Reyes', 'Peña', 'Delgado', 'Villalba',
    'Cruz', 'Giménez', 'Cabrera', 'Arias', 'Rojas', 'Vázquez', 'Ramos', 'Cáceres', 'Benítez', 'Godoy',
    'Luna', 'Carrizo', 'Funes', 'Moyano', 'Olivera', 'Quiroga', 'Ledesma', 'Soria', 'Barrios', 'Moreira',
    'Toledo', 'Sánchez', 'Ponce', 'Escobar', 'Ávalos', 'Cuello', 'Bustos', 'Mansilla', 'Ferreyra', 'Cardozo',
    'Leiva', 'Montenegro', 'Salinas', 'Aguero', 'Lucero', 'Méndez', 'Pizarro', 'Iglesias', 'Santos', 'Vera',
    'Rey', 'Laso', 'Marcone', 'Loyola', 'Tarabini', 'Ávalos', 'Pérez', 'Díaz', 'Moreno', 'Álvarez',
  ]

  let dniCounter = 0

  function makePlayers(baseDni: number, [y1, y2]: readonly [number, number]) {
    const players: { name: string; surname: string; dni: string; birthDate: Date; jerseyNumber: number }[] = []
    const shuffledNames = [...nombres].sort(() => Math.random() - 0.5)
    const shuffledApellidos = [...apellidos].sort(() => Math.random() - 0.5)

    for (let i = 0; i < 11; i++) {
      dniCounter++
      players.push({
        name: shuffledNames[i % shuffledNames.length],
        surname: shuffledApellidos[i % shuffledApellidos.length],
        dni: String(baseDni + dniCounter),
        birthDate: year(y1 + (i % (y2 - y1 + 1))),
        jerseyNumber: i + 1,
      })
    }
    return players
  }

  return categories.map((cat, catIdx) => ({
    category: { name: cat.name, minAge: cat.minAge, maxAge: cat.maxAge },
    teams: cat.names.map((name, i) => ({
      name,
      shortName: cat.shorts[i],
      color: cat.colors[i],
      players: makePlayers(40000000 + catIdx * 100000 + i * 1000, cat.yearRange),
    })),
  }))
}

const CANCHAS = [
  { name: 'Estadio Monumental', address: 'Av. Figueroa Alcorta 7597', city: 'CABA', capacity: 84000 },
  { name: 'Estadio Libertadores de América', address: 'Av. Boedo 871', city: 'Avellaneda', capacity: 47500 },
  { name: 'Estadio Presidente Perón', address: 'Av. Bartolomé Mitre 100', city: 'Avellaneda', capacity: 53000 },
  { name: 'Estadio Florencio Sola', address: 'Av. General Roca 1161', city: 'Banfield', capacity: 34000 },
  { name: 'Estadio Ciudad de Lanús', address: 'Av. General Güemes 1100', city: 'Lanús', capacity: 46500 },
  { name: 'Estadio José Amalfitani', address: 'Av. Juan B. Justo 9200', city: 'Liniers', capacity: 49000 },
  { name: 'Estadio Tomás A. Ducó', address: 'Av. Amancio Alcorta 2520', city: 'Parque Patricios', capacity: 48300 },
  { name: 'Estadio Jorge L. Hirschi', address: 'Calle 1 y 57', city: 'La Plata', capacity: 32500 },
]

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...\n')

  // Clean existing data in dependency order
  console.log('🧹 Cleaning existing data...')
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
  console.log('✓ Cleaned\n')

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
      season: '2026',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
    },
  })
  console.log(`✓ Liga: ${league.name}\n`)

  // 3. Categories
  const categoryRows = await Promise.all(
    buildAllTeams().map((g) =>
      prisma.category.create({ data: { name: g.category.name, minAge: g.category.minAge, maxAge: g.category.maxAge, leagueId: league.id } }),
    ),
  )
  console.log(`✓ Categorías: ${categoryRows.map((c) => c.name).join(', ')}\n`)

  // 4. Courts
  await prisma.court.createMany({ data: CANCHAS })
  console.log(`✓ Canchas: ${CANCHAS.length} creadas\n`)

  // 5. Teams + Players
  const groups = buildAllTeams()
  let totalPlayers = 0
  let totalTeams = 0

  for (let catIdx = 0; catIdx < groups.length; catIdx++) {
    const group = groups[catIdx]
    const category = categoryRows[catIdx]

    for (const t of group.teams) {
      const team = await prisma.team.create({
        data: { name: t.name, shortName: t.shortName, color: t.color, categoryId: category.id },
      })
      await prisma.player.createMany({
        data: t.players.map((p) => ({
          name: p.name, surname: p.surname, dni: p.dni,
          birthDate: p.birthDate, jerseyNumber: p.jerseyNumber,
          teamId: team.id, isActive: true,
        })),
      })
      totalTeams++
      totalPlayers += t.players.length
    }
    console.log(`  ✓ ${category.name}: ${group.teams.length} equipos → ${group.teams.length * 11} jugadores`)
  }

  console.log(`\n✅ Total: ${totalTeams} equipos, ${totalPlayers} jugadores`)
  console.log('Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
