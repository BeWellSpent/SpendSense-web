'use client'

import NextLink from 'next/link'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import { useLocale, useTranslations } from 'next-intl'
import { SECTION_SX } from '../constants'

export function PricingSection() {
  const t = useTranslations('landing')
  const locale = useLocale()

  return (
    <Box id="pricing" sx={{ ...SECTION_SX, bgcolor: 'primary.main' }}>
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom color="white">
          {t('pricing.title')}
        </Typography>
        <Typography variant="subtitle1" color="rgba(255,255,255,0.85)" sx={{ mb: 4 }}>
          {t('pricing.subtitle')}
        </Typography>
        <Card
          elevation={0}
          sx={{ p: 4, borderRadius: 3, border: '2px solid rgba(255,255,255,0.2)', bgcolor: 'rgba(255,255,255,0.1)' }}
        >
          <Typography variant="h3" fontWeight={800} color="white" gutterBottom>
            {t('pricing.freeTitle')}
          </Typography>
          <Typography variant="body1" color="rgba(255,255,255,0.88)" sx={{ mb: 3, lineHeight: 1.7 }}>
            {t('pricing.freeDesc')}
          </Typography>
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
              px: 5,
              '&:hover': { bgcolor: 'grey.100' },
            }}
          >
            {t('pricing.cta')}
          </Button>
        </Card>
      </Container>
    </Box>
  )
}
