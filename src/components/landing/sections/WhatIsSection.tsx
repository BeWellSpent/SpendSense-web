'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'
import { SECTION_SX } from '../constants'

export function WhatIsSection() {
  const t = useTranslations('landing')

  return (
    <Box sx={{ ...SECTION_SX, bgcolor: 'background.paper' }}>
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom color="primary">
          {t('whatIs.title')}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 680, mx: 'auto', lineHeight: 1.7, fontWeight: 400 }}>
          {t('whatIs.body')}
        </Typography>
      </Container>
    </Box>
  )
}
