import { ensureScope } from "@/lib/ensure-scope"

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function LeagueAdminLayout({
  children,
  params,
}: Props) {
  const { slug } = await params

  // Verify the user has access to this league
  await ensureScope(slug)

  // The parent (dashboard)/layout.tsx handles sidebar rendering.
  // This layout only performs the scope check and passes children through.
  return <>{children}</>
}
