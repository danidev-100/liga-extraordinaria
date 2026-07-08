import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import db from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, ShieldAlert, Shield, MoreHorizontal } from "lucide-react"
import { DeleteButton } from "@/components/forms/delete-button"
import { deleteAdmin } from "@/actions/admin"

export const dynamic = "force-dynamic"

export default async function AdminsPage() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin")
  }

  const admins = await db.admin.findMany({
    include: {
      league: { select: { name: true, slug: true, season: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-heading">Administradores</h1>
          <p className="text-muted-foreground">
            Gestioná los usuarios que administran cada liga
          </p>
        </div>
        <Link href="/admin/admins/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Admin
          </Button>
        </Link>
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle>Todos los administradores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {admins.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No hay administradores registrados.
            </p>
          ) : (
            <div className="divide-y">
              {admins.map((admin) => {
                const isSuperAdmin = admin.role === "SUPER_ADMIN"
                const isCurrentUser = admin.id === session.user.id
                return (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isSuperAdmin
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-primary/10 text-primary"
                      }`}>
                        {isSuperAdmin
                          ? <ShieldAlert className="h-5 w-5" />
                          : <Shield className="h-5 w-5" />
                        }
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">
                            {admin.name}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-muted-foreground">(vos)</span>
                            )}
                          </p>
                          <Badge
                            variant={isSuperAdmin ? "default" : "secondary"}
                            className="shrink-0 text-[10px]"
                          >
                            {isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {admin.email}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {admin.league
                            ? `Liga: ${admin.league.name} (${admin.league.season})`
                            : "Sin liga asignada"
                          }
                          {" · "}
                          Creado {new Date(admin.createdAt).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      {!isSuperAdmin && (
                        <>
                          <Link href={`/admin/admins/${admin.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <DeleteButton
                            action={deleteAdmin.bind(null, admin.id)}
                            confirmMessage={`¿Eliminar a ${admin.name}?`}
                          />
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
