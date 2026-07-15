'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import GroupIcon from '@mui/icons-material/Group'
import CategoryIcon from '@mui/icons-material/Category'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import SavingsIcon from '@mui/icons-material/Savings'
import BarChartIcon from '@mui/icons-material/BarChart'
import { useTranslations } from 'next-intl'
import { SECTION_SX } from '../constants'

const FEATURES = [
  { icon: <AttachMoneyIcon fontSize="large" />, titleKey: 'features.item1Title', descKey: 'features.item1Desc' },
  { icon: <GroupIcon fontSize="large" />, titleKey: 'features.item2Title', descKey: 'features.item2Desc' },
  { icon: <ReceiptLongIcon fontSize="large" />, titleKey: 'features.item3Title', descKey: 'features.item3Desc' },
  { icon: <SavingsIcon fontSize="large" />, titleKey: 'features.item4Title', descKey: 'features.item4Desc' },
  { icon: <CategoryIcon fontSize="large" />, titleKey: 'features.item5Title', descKey: 'features.item5Desc' },
  { icon: <BarChartIcon fontSize="large" />, titleKey: 'features.item6Title', descKey: 'features.item6Desc' },
] as const

export function FeaturesSection() {
  const t = useTranslations('landing')

  return (
    <Box id="features" sx={{ ...SECTION_SX, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {t('features.title')}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {t('features.subtitle')}
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {FEATURES.map(({ icon, titleKey, descKey }) => (
            <Grid item xs={12} sm={6} md={4} key={titleKey}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  p: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                }}
              >
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 1.5 }}>{icon}</Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {t(titleKey)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {t(descKey)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
