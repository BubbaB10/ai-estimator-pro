import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Estimator Pro - Professional Estimates in 30 Seconds',
  description: 'Turn any job description or photo into a professional estimate instantly. Built for plumbers, electricians, HVAC techs, roofers, and all trades.',
  keywords: 'contractor estimate, trade estimate, plumber estimate, electrician estimate, HVAC estimate, roofing estimate',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
