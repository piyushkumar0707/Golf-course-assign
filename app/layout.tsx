// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils"
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Fairway Funders - Play for Impact',
  description: 'Support charities by logging your golf scores.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("h-full", "font-sans", inter.variable)} suppressHydrationWarning>
      <body className={cn(inter.className, "min-h-screen flex flex-col antialiased bg-background")}>
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  )
}
