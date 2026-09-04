"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Plus, Edit, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { DeleteButton } from "@/components/forms/delete-button"
import { CourtForm } from "@/components/forms/court-form"
import { deleteCourt } from "@/actions/court"

interface CourtBrief {
  id: string
  name: string
  capacity: number | null
}

interface VenueCourtsManagerProps {
  venueId: string
  courts: CourtBrief[]
  venueName: string
}

export function VenueCourtsManager({ venueId, courts, venueName }: VenueCourtsManagerProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingCourt = editingId ? courts.find((c) => c.id === editingId) : undefined

  function startCreate() {
    setEditingId(null)
    setShowForm(true)
  }

  function startEdit(court: CourtBrief) {
    setEditingId(court.id)
    setShowForm(true)
  }

  function cancelForm() {
    setEditingId(null)
    setShowForm(false)
  }

  async function handleDelete(courtId: string) {
    await deleteCourt(courtId)
    router.refresh()
  }

  return (
    <CardContent>
      <div className="space-y-4">
        {courts.length === 0 && !showForm ? (
          <p className="text-center text-muted-foreground py-6">
            No hay canchas en {venueName} todavía.
          </p>
        ) : (
          <div className="divide-y">
            {courts.map((court) => (
              <div
                key={court.id}
                className="flex items-center justify-between py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{court.name}</p>
                  {court.capacity != null && (
                    <p className="text-sm text-muted-foreground">
                      Cap. {court.capacity}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(court)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <DeleteButton
                    action={async () => handleDelete(court.id)}
                    confirmMessage="¿Eliminar esta cancha?"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm ? (
          <div className="rounded-lg border border-dashed p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">
                {editingCourt ? `Editar ${editingCourt.name}` : "Nueva cancha"}
              </p>
              <Button variant="ghost" size="icon" onClick={cancelForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CourtForm
              venueId={venueId}
              initialData={editingCourt}
              onDone={() => {
                cancelForm()
                router.refresh()
              }}
            />
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={startCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Agregar Cancha
          </Button>
        )}
      </div>
    </CardContent>
  )
}