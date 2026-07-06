import { Suspense } from "react"
import type { Metadata } from "next"
import { LoginForm } from "./login-form"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Iniciar Sesión — Liga Extraordinaria",
  description: "Accedé al panel de administración de tu liga",
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-green-950 dark:via-zinc-950 dark:to-emerald-950">
      <div className="w-full max-w-sm space-y-4">
        <Skeleton className="mx-auto h-16 w-16 rounded-xl" />
        <Skeleton className="mx-auto h-6 w-56" />
        <Skeleton className="mx-auto h-4 w-64" />
        <div className="space-y-3 rounded-xl border bg-card p-6 shadow-sm">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
