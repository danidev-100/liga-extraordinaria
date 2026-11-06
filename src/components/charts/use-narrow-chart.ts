"use client"

import { useEffect, useState } from "react"

const NARROW_QUERY = "(max-width: 639px)"

/**
 * Tracks whether a chart is rendered in a narrow (mobile) viewport.
 * Every chart is mounted through a dynamic import with `ssr: false`, so the
 * initial `matchMedia` read happens on the client; the listener keeps the
 * value in sync on resize and device rotation.
 */
export function useNarrowChart(): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia(NARROW_QUERY).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(NARROW_QUERY)
    const update = () => setNarrow(mql.matches)
    update()
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [])

  return narrow
}
