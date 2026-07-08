import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import db from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const result = await db.league.updateMany({
    where: { isActive: false },
    data: { isActive: true },
  })

  return NextResponse.json({ activated: result.count })
}
