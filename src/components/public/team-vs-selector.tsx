"use client"

import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TeamLogo } from "@/components/ui/team-logo"

interface TeamOption {
  id: string
  name: string
  shortName: string
  color: string | null
  logoUrl: string | null
}

interface TeamVsSelectorProps {
  teams: TeamOption[]
  currentTeamId: string
}

export function TeamVsSelector({ teams, currentTeamId }: TeamVsSelectorProps) {
  const router = useRouter()

  function handleSelect(value: string | null) {
    if (value) {
      router.push(`/teams/${currentTeamId}/vs/${value}`)
    }
  }

  if (teams.length === 0) return null

  return (
    <Select onValueChange={handleSelect}>
      <SelectTrigger className="w-full max-w-xs">
        <SelectValue placeholder="Seleccionar rival..." />
      </SelectTrigger>
      <SelectContent>
        {teams.map((team) => (
          <SelectItem key={team.id} value={team.id}>
            <TeamLogo
              logoUrl={team.logoUrl}
              color={team.color}
              name={team.name}
              size="sm"
            />
            <span>{team.shortName}</span>
            <span className="text-xs text-muted-foreground">— {team.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
