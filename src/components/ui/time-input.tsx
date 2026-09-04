"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

interface TimeInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> {
  value: string
  onChange: (value: string) => void
}

const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/

/**
 * Convert user input into a 24h "HH:mm" string.
 * - Keeps valid 24h values as-is ("14:00").
 * - Normalizes pasted 12h values ("2:00 PM" -> "14:00", "12:30 AM" -> "00:30").
 * - Shapes progressive typing: digits only, colon inserted after the hour ("1400" -> "14:00").
 */
export function normalizeTimeInput(raw: string): string {
  const trimmed = raw.trim()

  if (TIME_24H.test(trimmed)) return trimmed

  const meridiemMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/)
  if (meridiemMatch) {
    let hours = Number(meridiemMatch[1])
    const minutes = meridiemMatch[2]
    const meridiem = meridiemMatch[3]?.toUpperCase()
    if (meridiem === "PM" && hours < 12) hours += 12
    if (meridiem === "AM" && hours === 12) hours = 0
    if (hours <= 23) return `${String(hours).padStart(2, "0")}:${minutes}`
  }

  const digits = raw.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(function TimeInput(
  { value, onChange, ...props },
  ref,
) {
  return (
    <Input
      ref={ref}
      type="text"
      inputMode="numeric"
      maxLength={5}
      placeholder="14:00"
      value={value}
      onChange={(event) => onChange(normalizeTimeInput(event.target.value))}
      {...props}
    />
  )
})

export { TimeInput }