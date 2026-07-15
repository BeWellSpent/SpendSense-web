'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'
import { SECTION_SX } from '../constants'

export function AboutSection() {
  const t = useTranslations('landing')

  return (
    <Box sx={{ ...SECTION_SX, bgcolor: 'background.paper' }}>
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {t('about.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
          {t('about.body')}
        </Typography>
      </Container>
    </Box>
  )
}
