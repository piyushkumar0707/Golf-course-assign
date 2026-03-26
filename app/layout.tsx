import type { Metadata } from 'next'
import { Inter, Geist } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Golf Charity - Play for Impact',
  description: 'Support charities by logging your golf scores.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("h-full", "font-sans", geist.variable)}>
      <body className={`${inter.className} h-full antialiased`}>
        {children}
      </body>
    </html>
  )
}
