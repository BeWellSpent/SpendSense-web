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

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authClient.login({ email, password })
      await fetch('/api/auth/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: res.accessToken }),
      })
      logger.info('auth.login')
      router.push('/budgets')
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
        autoComplete="current-password"
      />
      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}
      <Button type="submit" variant="contained" fullWidth disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
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
        No account?{' '}
        <Link component={NextLink} href="/register">
          Create one
        </Link>
      </Typography>
    </Stack>
  )
}
