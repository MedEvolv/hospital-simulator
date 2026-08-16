import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Institutional Mirror | ArchLife',
  description: 'A synthetic-scenario governance simulator for clinical AI systems. Not clinical decision support or live hospital monitoring.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-slate-900 focus:text-white focus:px-4 py-2 focus:rounded-lg focus:shadow-lg focus:outline-none"
        >
          Skip to content
        </a>
        <div id="main-content" className="flex-1">
          {children}
        </div>
        <SiteFooter />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
