import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import db from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN"

  const leagues = await db.league.findMany({
    where: isSuperAdmin
      ? undefined
      : { admins: { some: { id: session.user.id } } },
    select: { id: true, name: true, slug: true, season: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(leagues)
}
