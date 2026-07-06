"use server"

import db from "@/lib/db"
import { getFormTrend } from "@/lib/analytics"
import type { FormTrendRow } from "@/lib/analytics"

/**
 * Server action wrapper around getFormTrend for the FormTrendChart
 * category filter callback. Accepts null for "all categories".
 */
export async function getFormTrendAction(
  categoryId: string | null,
): Promise<FormTrendRow[]> {
  return getFormTrend(categoryId ?? undefined)
}

/**
 * Returns all categories for the form trend dropdown filter.
 */
export async function getCategories(): Promise<{ id: string; name: string }[]> {
  return db.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}
