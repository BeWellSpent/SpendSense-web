import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { Analytics } from '@vercel/analytics/next'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import { ThemeRegistry } from '@/components/ui/ThemeRegistry'

export const metadata: Metadata = {
  title: 'WellSpent',
  description: 'Income-first budgeting',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-128.png', sizes: '128x128', type: 'image/png' },
    ],
    apple: { url: '/favicon-128.png', sizes: '128x128' },
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Runs before React hydrates — sets data-mui-color-scheme on <html> from localStorage,
            so CSS variables snap to the correct scheme with zero flash. */}
        <InitColorSchemeScript defaultMode="system" modeStorageKey="theme-mode" />
        <ThemeRegistry>{children}</ThemeRegistry>
        <Analytics />
      </body>
    </html>
  )
}
