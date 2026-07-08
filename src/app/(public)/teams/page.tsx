import { redirectToScopedLeague } from "@/lib/old-path-redirect"

export default async function TeamsPage() {
  await redirectToScopedLeague("equipos")
  return null
}
