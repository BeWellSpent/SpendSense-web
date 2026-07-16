'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { UserService } from '@/gen/wellspent/v1/user_connect'
import { AuthService } from '@/gen/wellspent/v1/auth_connect'
import { useClient } from '@/hooks/useClient'
import { logger } from '@/lib/logger'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'

const RESEND_COOLDOWN_MS = 60_000

export function EmailVerificationBanner() {
  const t = useTranslations('auth.banner')
  const userClient = useClient(UserService)
  const authClient = useClient(AuthService)

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const cooldownTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(cooldownTimer.current), [])

  const { data } = useQuery({
    queryKey: ['getMe'],
    queryFn: () => userClient.getMe({}),
  })

  const user = data?.user
  if (!user || user.isVerified) return null

  async function handleResend() {
    if (!user) return
    setSending(true)
    setError('')
    try {
      await authClient.resendVerificationEmail({ email: user.email })
      setSent(true)
      logger.info('auth.verification.resend')
      cooldownTimer.current = setTimeout(() => setSent(false), RESEND_COOLDOWN_MS)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend verification email'
      setError(message)
      logger.error('auth.verification.resend.failed', { error: message })
    } finally {
      setSending(false)
    }
  }

  return (
    <Alert
      severity="warning"
      sx={{ borderRadius: 0 }}
      action={
        <Button color="inherit" size="small" onClick={handleResend} disabled={sending || sent}>
          {sending ? t('sending') : sent ? t('sent') : t('resend')}
        </Button>
      }
    >
      {error || t('message')}
    </Alert>
  )
}
