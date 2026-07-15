export const LOCALE_LABELS: Record<string, string> = { en: 'English', es: 'Español' }

export const HERO_SLIDES = [
  { bg: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 60%, #1976d2 100%)' },
  { bg: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 60%, #388e3c 100%)' },
  { bg: 'linear-gradient(135deg, #37474f 0%, #455a64 60%, #607d8b 100%)' },
]

export const SLIDE_INTERVAL_MS = 4500

export const NAV_SECTIONS = [
  { key: 'features', id: 'features' },
  { key: 'useCases', id: 'use-cases' },
  { key: 'pricing', id: 'pricing' },
  { key: 'download', id: 'download' },
] as const

export const SECTION_SX = {
  scrollMarginTop: '64px',
  py: { xs: 8, sm: 10 },
}

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
