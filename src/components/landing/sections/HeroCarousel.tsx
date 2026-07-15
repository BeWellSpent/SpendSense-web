'use client'

import { useCallback, useEffect, useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import NextLink from 'next/link'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Fade from '@mui/material/Fade'
import { useLocale, useTranslations } from 'next-intl'
import { HERO_SLIDES, SLIDE_INTERVAL_MS, scrollToSection } from '../constants'

export function HeroCarousel() {
  const t = useTranslations('landing')
  const locale = useLocale()
  const isMobile = useIsMobile()

  const [activeSlide, setActiveSlide] = useState(0)
  const [slideVisible, setSlideVisible] = useState(true)

  const advanceSlide = useCallback(() => {
    setSlideVisible(false)
    setTimeout(() => {
      setActiveSlide((s) => (s + 1) % HERO_SLIDES.length)
      setSlideVisible(true)
    }, 300)
  }, [])

  useEffect(() => {
    const timer = setInterval(advanceSlide, SLIDE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [advanceSlide])

  return (
    <Box
      sx={{
        position: 'relative',
        height: { xs: '70dvh', sm: '80dvh' },
        minHeight: 400,
        overflow: 'hidden',
        background: HERO_SLIDES[activeSlide].bg,
        transition: 'background 0.6s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Subtle pattern overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.05,
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center', px: { xs: 3, sm: 4 } }}>
        <Fade in={slideVisible} timeout={300}>
          <Box>
            <Typography
              variant={isMobile ? 'h3' : 'h2'}
              component="h1"
              fontWeight={800}
              color="white"
              gutterBottom
              sx={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)', lineHeight: 1.15 }}
            >
              {t(`hero.slide${activeSlide + 1}Title`)}
            </Typography>
            <Typography
              variant={isMobile ? 'body1' : 'h6'}
              color="rgba(255,255,255,0.88)"
              sx={{ mb: 4, maxWidth: 560, mx: 'auto', fontWeight: 400 }}
            >
              {t(`hero.slide${activeSlide + 1}Sub`)}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={NextLink}
                href={`/${locale}/register`}
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 4,
                  '&:hover': { bgcolor: 'grey.100' },
                }}
              >
                {t('hero.cta')}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => scrollToSection('features')}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.6)',
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 3,
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                {t('hero.learnMore')}
              </Button>
            </Box>
          </Box>
        </Fade>
      </Container>

      {/* Slide dots */}
      <Box sx={{ position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 1 }}>
        {HERO_SLIDES.map((_, i) => (
          <Box
            key={i}
            onClick={() => { setActiveSlide(i); setSlideVisible(true) }}
            sx={{
              width: i === activeSlide ? 20 : 8,
              height: 8,
              borderRadius: 4,
              bgcolor: i === activeSlide ? 'white' : 'rgba(255,255,255,0.45)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </Box>
    </Box>
  )
}
