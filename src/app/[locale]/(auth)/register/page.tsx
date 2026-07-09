import { Suspense } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { getTranslations } from 'next-intl/server'

export default async function RegisterPage() {
  const t = await getTranslations('auth.register')
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Box sx={{ width: '100%', maxWidth: 420, p: 4, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={3} textAlign="center">
          {t('title')}
        </Typography>
        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} /></Box>}>
          <RegisterForm />
        </Suspense>
      </Box>
    </Box>
  )
}
