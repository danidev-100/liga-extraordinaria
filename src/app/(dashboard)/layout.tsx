import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Sidebar } from "@/components/layout/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar email={session.user?.email} />
      <main className="min-w-0 flex-1 overflow-x-auto px-6 pb-6 pt-14 md:p-8">
        {children}
      </main>
    </div>
  )
}
