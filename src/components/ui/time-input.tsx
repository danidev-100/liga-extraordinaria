"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const TIME_MINUTES = ["00", "15", "30", "45"]

/** Build the "HH" part options. */
export const TIME_HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
  id?: string
  name?: string
  disabled?: boolean
}

/**
 * Split a "HH:mm" value into hour + minute, rounding the minute to the closest
 * 15-min step so the select always has a valid option. Falls back to 20:00.
 */
export function parseTimeParts(value: string): { hours: string; minutes: string } {
  const match = /^(\d{1,2}):(\d{2})$/.exec((value ?? "").trim())
  if (!match) return { hours: "20", minutes: "00" }
  const h = Number(match[1])
  if (h < 0 || h > 23) return { hours: "20", minutes: "00" }
  const m = Number(match[2])
  if (Number.isNaN(m)) return { hours: String(h).padStart(2, "0"), minutes: "00" }
  const rounded = Math.round(m / 15) * 15
  const safe = rounded === 60 ? "00" : String(rounded).padStart(2, "0")
  return { hours: String(h).padStart(2, "0"), minutes: safe }
}

/**
 * Two dropdowns — hour (00–23) and minutes (00/15/30/45) — always 24h.
 * Keeps the same `value`/`onChange` contract as the previous text input
 * ("HH:mm"), so forms don't need to change.
 */
const TimeInput = React.forwardRef<HTMLDivElement, TimeInputProps>(function TimeInput(
  { value, onChange, className, id, name, disabled },
  ref,
) {
  const { hours, minutes } = parseTimeParts(value)

  function handleHoursChange(nextHours: string | null) {
    if (nextHours === null) return
    onChange(`${nextHours}:${minutes}`)
  }

  function handleMinutesChange(nextMinutes: string | null) {
    if (nextMinutes === null) return
    onChange(`${hours}:${nextMinutes}`)
  }

  return (
    <div ref={ref} id={id} data-slot="time-input" className={className} data-name={name}>
      <div className="flex items-center gap-1">
        <Select value={hours} onValueChange={handleHoursChange} disabled={disabled}>
          <SelectTrigger size="sm" className="w-16" aria-label="Hora">
            <SelectValue>{hours}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TIME_HOURS.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">:</span>
        <Select value={minutes} onValueChange={handleMinutesChange} disabled={disabled}>
          <SelectTrigger size="sm" className="w-16" aria-label="Minutos">
            <SelectValue>{minutes}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TIME_MINUTES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
})

export { TimeInput }