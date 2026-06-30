'use client'

import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@connectrpc/connect'
import { AuthService } from '@/gen/spendsense/v1/auth_connect'
import { UserService } from '@/gen/spendsense/v1/user_connect'
import { FilingStatus } from '@/gen/spendsense/v1/common_pb'
import { publicTransport, createTransport } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { isEnabled } from '@/lib/config/features'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import Link from '@mui/material/Link'
import NextLink from 'next/link'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'

const authClient = createClient(AuthService, publicTransport)
const userClient = createClient(UserService, publicTransport)

const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'],
  ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
  ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
  ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'], ['WY', 'Wyoming'], ['DC', 'District of Columbia'],
]

const FILING_STATUS_OPTIONS = [
  { value: FilingStatus.SINGLE, label: 'Single' },
  { value: FilingStatus.MARRIED_FILING_JOINTLY, label: 'Married Filing Jointly' },
  { value: FilingStatus.MARRIED_FILING_SEPARATELY, label: 'Married Filing Separately' },
  { value: FilingStatus.HEAD_OF_HOUSEHOLD, label: 'Head of Household' },
  { value: FilingStatus.QUALIFYING_SURVIVING_SPOUSE, label: 'Qualifying Surviving Spouse' },
]

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
]

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'ARS', label: 'ARS — Argentine Peso' },
  { value: 'EUR', label: 'EUR — Euro' },
]

export function RegisterForm() {
  const t = useTranslations('auth.register')
  const tCommon = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [filingStatus, setFilingStatus] = useState<FilingStatus>(FilingStatus.UNSPECIFIED)
  const [language, setLanguage] = useState(locale)
  const [currency, setCurrency] = useState('USD')
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([])
  const [countriesLoading, setCountriesLoading] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    userClient.listCountries({}).then((res) => {
      setCountries(res.countries.map((c) => ({ code: c.code, name: c.name })))
    }).catch((err) => {
      logger.error('register.listCountries.failed', { error: err instanceof Error ? err.message : String(err) })
    }).finally(() => {
      setCountriesLoading(false)
    })
  }, [])

  async function handleGoogleSignIn() {
    const state = crypto.randomUUID()
    sessionStorage.setItem('google_oauth_state', state)
    localStorage.setItem('spendsense_locale', language)
    localStorage.setItem('spendsense_currency', currency)
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
      const res = await authClient.register({
        firstName, lastName, email, password, countryCode, stateCode, language, currency,
      })

      // Persist filing status before setting the cookie so profile is complete on first load
      if (countryCode === 'US' && filingStatus !== FilingStatus.UNSPECIFIED) {
        const authedUserClient = createClient(UserService, createTransport(res.accessToken))
        await authedUserClient.updateMe({
          firstName,
          lastName,
          countryCode,
          stateCode,
          filingStatus,
          taxPaymentFrequency: 0,
          language,
          currency,
        }).catch((err) => {
          logger.error('register.updateFilingStatus.failed', { error: err instanceof Error ? err.message : String(err) })
        })
      }

      await fetch('/api/auth/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: res.accessToken }),
      })
      localStorage.setItem('spendsense_locale', language)
      localStorage.setItem('spendsense_currency', currency)
      logger.info('auth.register')
      router.push('/budgets', { locale: language })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
      logger.error('auth.register.failed', { error: message })
    } finally {
      setLoading(false)
    }
  }

  const isUS = countryCode === 'US'

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2}>
      <Stack direction="row" spacing={2}>
        <FormControl fullWidth size="small">
          <InputLabel>{tCommon('language')}</InputLabel>
          <Select
            label={tCommon('language')}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>{tCommon('currency')}</InputLabel>
          <Select
            label={tCommon('currency')}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          label={t('firstName')}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label={t('lastName')}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          fullWidth
        />
      </Stack>
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
        autoComplete="new-password"
        helperText={t('passwordHint')}
      />

      <FormControl fullWidth size="small" disabled={countriesLoading}>
        <InputLabel>{t('country')}</InputLabel>
        <Select
          label={t('country')}
          value={countryCode}
          onChange={(e) => { setCountryCode(e.target.value); setStateCode(''); setFilingStatus(FilingStatus.UNSPECIFIED) }}
          endAdornment={
            countriesLoading ? (
              <InputAdornment position="end" sx={{ mr: 3 }}>
                <CircularProgress size={16} />
              </InputAdornment>
            ) : undefined
          }
        >
          <MenuItem value="">{t('preferNotToSay')}</MenuItem>
          {countries.map((c) => (
            <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {isUS && (
        <FormControl fullWidth size="small">
          <InputLabel>{t('state')}</InputLabel>
          <Select
            label={t('state')}
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
          >
            <MenuItem value="">{t('selectState')}</MenuItem>
            {US_STATES.map(([code, name]) => (
              <MenuItem key={code} value={code}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {isUS && (
        <FormControl fullWidth size="small">
          <InputLabel>{t('filingStatus')}</InputLabel>
          <Select
            label={t('filingStatus')}
            value={filingStatus}
            onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
          >
            <MenuItem value={FilingStatus.UNSPECIFIED}>{t('selectFilingStatus')}</MenuItem>
            {FILING_STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

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
        {t('hasAccount')}{' '}
        <Link component={NextLink} href={`/${language}/login`}>
          {t('signIn')}
        </Link>
      </Typography>
    </Stack>
  )
}
