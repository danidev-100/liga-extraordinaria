export type ScheduleParams = {
  categoryId?: string | null
  fecha?: number | null
}

export function parseFechaParam(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "") return undefined
  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed) || parsed < 1) return undefined
  return parsed
}

export function buildScheduleHref(
  basePath: string,
  params: ScheduleParams = {},
): string {
  const { categoryId, fecha } = params
  const search = new URLSearchParams()
  if (categoryId) search.set("categoryId", categoryId)
  if (typeof fecha === "number" && Number.isInteger(fecha) && fecha >= 1) {
    search.set("fecha", String(fecha))
  }
  const query = search.toString()
  return query ? `${basePath}?${query}` : basePath
}
