'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@connectrpc/connect'
import { AuthService } from '@/gen/wellspent/v1/auth_connect'
import { publicTransport } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import CircularProgress from '@mui/material/CircularProgress'
import Link from '@mui/material/Link'
import NextLink from 'next/link'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

interface Props {
  verificationToken: string
  locale: string
  isLoggedIn: boolean
}

const publicClient = createClient(AuthService, publicTransport)

export function VerifyEmailContent({ verificationToken, locale, isLoggedIn }: Props) {
  const t = useTranslations('auth.verifyEmail')
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')

  useEffect(() => {
    publicClient.verifyEmail({ token: verificationToken })
      .then(() => {
        setStatus('success')
        logger.info('auth.verifyEmail')
      })
      .catch((err) => {
        setStatus('error')
        logger.error('auth.verifyEmail.failed', { error: err instanceof Error ? err.message : String(err) })
      })
  }, [verificationToken])

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 480 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Typography variant="h6" fontWeight={700}>WellSpent</Typography>

            {status === 'verifying' && (
              <Stack spacing={2} alignItems="center" sx={{ py: 2 }}>
                <CircularProgress />
                <Typography color="text.secondary">{t('verifying')}</Typography>
              </Stack>
            )}

            {status === 'success' && (
              <Stack spacing={2} alignItems="center">
                <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
                <Typography>{t('success')}</Typography>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  component={NextLink}
                  href={isLoggedIn ? `/${locale}/budgets` : `/${locale}/login`}
                >
                  {isLoggedIn ? t('goToBudgets') : t('signIn')}
                </Button>
              </Stack>
            )}

            {status === 'error' && (
              <Stack spacing={2} alignItems="center">
                <ErrorOutlineIcon color="error" sx={{ fontSize: 48 }} />
                <Typography color="text.secondary">{t('error')}</Typography>
                <Link component={NextLink} href={`/${locale}/login`} variant="body2">
                  {t('signIn')}
                </Link>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
