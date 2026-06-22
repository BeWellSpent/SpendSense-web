'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import Link from '@mui/material/Link'
import NextLink from 'next/link'

const authClient = createClient(AuthService, publicTransport)

export function RegisterForm() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authClient.register({ firstName, lastName, email, password })
      await fetch('/api/auth/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: res.accessToken }),
      })
      logger.info('auth.register')
      router.push('/budgets')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
      logger.error('auth.register.failed', { error: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2}>
      <Stack direction="row" spacing={2}>
        <TextField
          label="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          fullWidth
        />
      </Stack>
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        autoComplete="email"
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
        autoComplete="new-password"
        helperText="8+ characters with uppercase, lowercase, digit, and special character"
      />
      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}
      <Button type="submit" variant="contained" fullWidth disabled={loading}>
        {loading ? 'Creating account…' : 'Create account'}
      </Button>

      <Divider>or</Divider>

      <Tooltip title="Google sign-in is not available yet" placement="top">
        <span>
          <Button
            variant="outlined"
            fullWidth
            disabled={!isEnabled('googleAuth')}
            sx={{ pointerEvents: isEnabled('googleAuth') ? 'auto' : 'none', opacity: 0.5 }}
          >
            Continue with Google
          </Button>
        </span>
      </Tooltip>

      <Typography variant="body2" textAlign="center">
        Already have an account?{' '}
        <Link component={NextLink} href="/login">
          Sign in
        </Link>
      </Typography>
    </Stack>
  )
}
