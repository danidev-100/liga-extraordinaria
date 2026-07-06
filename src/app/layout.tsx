import type { Metadata } from "next"
import { Barlow, Barlow_Condensed } from "next/font/google"
import "./globals.css"
import Providers from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"

const barlow = Barlow({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const barlowCondensed = Barlow_Condensed({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: {
    default: "Liga Extraordinaria",
    template: "%s — Liga Extraordinaria",
  },
  description: "Gestión de ligas de fútbol, equipos, partidos y posiciones",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${barlow.variable} ${barlowCondensed.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
