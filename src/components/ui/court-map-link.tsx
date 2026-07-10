"use client"

import { MapPin } from "lucide-react"

interface CourtMapLinkProps {
  href: string
  name: string
}

export function CourtMapLink({ href, name }: CourtMapLinkProps) {
  return (
    <span
      role="link"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation()
        window.open(href, "_blank", "noopener,noreferrer")
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          e.stopPropagation()
          window.open(href, "_blank", "noopener,noreferrer")
        }
      }}
      className="inline-flex cursor-pointer items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
    >
      <MapPin className="h-3 w-3" />
      {name}
    </span>
  )
}
