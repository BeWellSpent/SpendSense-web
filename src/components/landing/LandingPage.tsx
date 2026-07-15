'use client'

import Box from '@mui/material/Box'
import { LandingNav } from './sections/LandingNav'
import { HeroCarousel } from './sections/HeroCarousel'
import { WhatIsSection } from './sections/WhatIsSection'
import { FeaturesSection } from './sections/FeaturesSection'
import { UseCasesSection } from './sections/UseCasesSection'
import { PricingSection } from './sections/PricingSection'
import { DownloadSection } from './sections/DownloadSection'
import { AboutSection } from './sections/AboutSection'
import { LandingFooter } from './sections/LandingFooter'

export function LandingPage() {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <LandingNav />
      <HeroCarousel />
      <WhatIsSection />
      <FeaturesSection />
      <UseCasesSection />
      <PricingSection />
      <DownloadSection />
      <AboutSection />
      <LandingFooter />
    </Box>
  )
}
