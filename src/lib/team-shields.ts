/**
 * Shield lookup for the real league teams.
 *
 * Source of truth for team shields living in public/escudos/. When a team has
 * no logoUrl in the database, TeamLogo falls back to this map so shields are
 * ready in production without a data migration.
 *
 * Keys are matched case/accents/spaces insensitive (normalize + compact), so
 * "Fundación Gargantini" resolves to "Fundacion Gargantini.jpeg" and
 * "Cata 50" resolves to "cata50.jpeg".
 */

export const TEAM_SHIELDS: Record<string, string> = {
  "Andes Origen": "/escudos/Andes Origen.jpeg",
  "Barrilete Cósmico": "/escudos/Barrilete Cosmico.jpeg",
  "Barrio Uruguay": "/escudos/Barrio Uruguay.jpeg",
  "Buen Orden": "/escudos/Buen Orden.jpeg",
  "Cata": "/escudos/Cata.jpeg",
  "Cata 50": "/escudos/cata50.jpeg",
  "Fundación Gargantini": "/escudos/Fundacion Gargantini.jpeg",
  "Fyma": "/escudos/Fyma.jpeg",
  "La Amistad": "/escudos/La Amistad.jpeg",
  "La Colonia": "/escudos/La Colonia.jpeg",
  "La Florida": "/escudos/La Florida.jpeg",
  "La Rotonda": "/escudos/La Rotonda.jpeg",
  "Los Maestros": "/escudos/Los Maestros.jpeg",
  "Real Sociedad": "/escudos/Real Sociedad.jpeg",
  "Rey León": "/escudos/Rey Leon.jpeg",
  "Saint Tropez": "/escudos/Saint tropez.jpeg",
  "Sportivo Victoria": "/escudos/Sportivo Victoria.jpeg",
  "Unidos FC": "/escudos/Unidos FC.jpeg",
}

function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

function compact(name: string): string {
  return normalize(name).replace(/\s+/g, "")
}

const index = new Map<string, string>()
for (const [teamName, shieldPath] of Object.entries(TEAM_SHIELDS)) {
  index.set(normalize(teamName), shieldPath)
  index.set(compact(teamName), shieldPath)
}

export function resolveTeamShield(teamName: string | null | undefined): string | null {
  if (!teamName) return null
  return index.get(normalize(teamName)) ?? index.get(compact(teamName)) ?? null
}