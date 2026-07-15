'use client'

import Image from 'next/image'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

export function LandingFooter() {
  const t = useTranslations('landing')

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 5,
        px: 3,
        bgcolor: '#111827',
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Image src="/web-header.png" alt="WellSpent" width={140} height={31} style={{ objectFit: 'contain' }} />
      </Box>
      <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
        {t('footer.tagline')}
      </Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
        {t('footer.rights', { year: new Date().getFullYear() })}
      </Typography>
    </Box>
  )
}
