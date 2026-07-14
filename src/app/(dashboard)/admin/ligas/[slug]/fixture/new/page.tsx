import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ensureScope } from "@/lib/ensure-scope"
import Link from "next/link"
import db from "@/lib/db"
import { FixtureForm } from "@/components/forms/fixture-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ExportFixturePDF } from "@/components/forms/export-fixture-pdf"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ScopedNewFixturePage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { slug } = await params
  const { leagueId } = await ensureScope(slug)

  const categories = await db.category.findMany({
    where: { leagueId, isActive: true },
    include: {
      league: { select: { name: true } },
      _count: { select: { teams: true } },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/ligas/${slug}/matches`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a partidos
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Generar Temporada</h1>
        <p className="text-muted-foreground">
          Creá un fixture completo con todos los equipos de una categoría jugando entre sí
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de la temporada</CardTitle>
        </CardHeader>
        <CardContent>
          <FixtureForm categories={categories} />
        </CardContent>
      </Card>

      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Exportar fixture a PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <ExportFixturePDF categories={categories} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
