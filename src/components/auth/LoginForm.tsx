'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@connectrpc/connect'
import { AuthService } from '@/gen/spendsense/v1/auth_connect'
import { publicTransport } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { isEnabled } from '@/lib/config/features'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Link from '@mui/material/Link'
import NextLink from 'next/link'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'

const authClient = createClient(AuthService, publicTransport)

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
]

export function LoginForm() {
  const t = useTranslations('auth.login')
  const tCommon = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [language, setLanguage] = useState(locale)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleLanguageChange(newLang: string) {
    setLanguage(newLang)
    // Switch the page locale immediately
    router.replace('/login', { locale: newLang })
  }

  async function handleGoogleSignIn() {
    const state = crypto.randomUUID()
    sessionStorage.setItem('google_oauth_state', state)
    // Persist locale preference for the callback page
    localStorage.setItem('spendsense_locale', language)
    try {
      const res = await authClient.getGoogleAuthURL({ state })
      window.location.href = res.url
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initiate Google sign-in'
      setError(message)
      logger.error('auth.google.initiate.failed', { error: message })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authClient.login({ email, password, rememberMe })
      await fetch('/api/auth/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: res.accessToken, expiresIn: Number(res.expiresIn) }),
      })
      // Store locale/currency for use throughout the app
      const userLocale = res.language || language
      const userCurrency = res.currency || 'USD'
      localStorage.setItem('spendsense_locale', userLocale)
      localStorage.setItem('spendsense_currency', userCurrency)
      logger.info('auth.login')
      if (redirect) {
        window.location.href = redirect
      } else {
        router.push('/budgets', { locale: userLocale })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      logger.error('auth.login.failed', { error: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2}>
      <FormControl fullWidth size="small">
        <InputLabel>{tCommon('language')}</InputLabel>
        <Select
          label={tCommon('language')}
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label={t('email')}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        autoComplete="email"
      />
      <TextField
        label={t('password')}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
        autoComplete="current-password"
      />
      <FormControlLabel
        control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} size="small" />}
        label={<Typography variant="body2">{t('rememberMe')}</Typography>}
      />
      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}
      <Button type="submit" variant="contained" fullWidth disabled={loading}>
        {loading ? t('submitting') : t('submit')}
      </Button>

      <Divider>or</Divider>

      {isEnabled('googleAuth') ? (
        <Button variant="outlined" fullWidth onClick={handleGoogleSignIn} disabled={loading}>
          {t('googleBtn')}
        </Button>
      ) : (
        <Tooltip title={t('googleUnavailable')} placement="top">
          <span>
            <Button variant="outlined" fullWidth disabled sx={{ pointerEvents: 'none', opacity: 0.5 }}>
              {t('googleBtn')}
            </Button>
          </span>
        </Tooltip>
      )}

      <Typography variant="body2" textAlign="center">
        {t('noAccount')}{' '}
        <Link component={NextLink} href={`/${language}/register`}>
          {t('createOne')}
        </Link>
      </Typography>
    </Stack>
  )
}
