'use client'

import NextLink from 'next/link'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import LanguageIcon from '@mui/icons-material/Language'
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone'
import AndroidIcon from '@mui/icons-material/Android'
import { useLocale, useTranslations } from 'next-intl'
import { SECTION_SX } from '../constants'

export function DownloadSection() {
  const t = useTranslations('landing')
  const locale = useLocale()

  return (
    <Box id="download" sx={{ ...SECTION_SX, bgcolor: 'background.default' }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {t('download.title')}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {t('download.subtitle')}
          </Typography>
        </Box>
        <Grid container spacing={3} justifyContent="center">
          {/* Web */}
          <Grid item xs={12} sm={4}>
            <Card
              elevation={0}
              sx={{ textAlign: 'center', p: 2, border: '2px solid', borderColor: 'primary.main', borderRadius: 2, height: '100%' }}
            >
              <CardContent>
                <LanguageIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {t('download.webTitle')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t('download.webDesc')}
                </Typography>
                <Button
                  component={NextLink}
                  href={`/${locale}/login`}
                  variant="contained"
                  fullWidth
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  {t('download.webCta')}
                </Button>
              </CardContent>
            </Card>
          </Grid>
          {/* iOS */}
          <Grid item xs={12} sm={4}>
            <Card
              elevation={0}
              sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%', opacity: 0.75 }}
            >
              <CardContent>
                <PhoneIphoneIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {t('download.iosTitle')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('download.iosDesc')}
                </Typography>
                <Chip label={t('download.comingSoon')} size="small" variant="outlined" />
              </CardContent>
            </Card>
          </Grid>
          {/* Android */}
          <Grid item xs={12} sm={4}>
            <Card
              elevation={0}
              sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%', opacity: 0.75 }}
            >
              <CardContent>
                <AndroidIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {t('download.androidTitle')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('download.androidDesc')}
                </Typography>
                <Chip label={t('download.comingSoon')} size="small" variant="outlined" />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
