"use server"

import db from "@/lib/db"
import { getFormTrend } from "@/lib/analytics"
import type { FormTrendRow } from "@/lib/analytics"

/**
 * Server action wrapper around getFormTrend for the FormTrendChart
 * category filter callback. Accepts null for "all categories".
 * Optional leagueId scopes the trend to a specific league.
 */
export async function getFormTrendAction(
  categoryId: string | null,
  leagueId?: string,
): Promise<FormTrendRow[]> {
  return getFormTrend(categoryId ?? undefined, leagueId)
}

/**
 * Returns categories for the form trend dropdown filter.
 * When leagueId is provided, only categories from that league are returned.
 */
export async function getCategories(leagueId?: string): Promise<{ id: string; name: string }[]> {
  return db.category.findMany({
    where: leagueId ? { leagueId } : undefined,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}
