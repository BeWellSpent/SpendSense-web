export const TOKEN_COOKIE = 'spendsense_token'

// SameSite=Strict excludes the cookie not just on cross-site requests but on
// some top-level navigations mobile browsers treat as "externally initiated"
// even to the same site — pull-to-refresh, reopening from recents, PWA-style
// relaunches. That reads as an instant, cookie-missing redirect to login on
// refresh, even though the cookie was set correctly moments earlier. Lax is
// the standard choice for auth session cookies for exactly this reason: it
// still blocks the cross-site state-changing (POST/PUT/DELETE) requests
// Strict exists for, but survives normal top-level GET navigation.
const BASE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

// Fallback used only if the caller can't tell us the token's real lifetime.
// Matches the backend's default (non-remember-me) JWT lifetime.
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24

// The cookie's maxAge must always match the actual JWT lifetime, not a
// guess. Login, Register, and Google OAuth exchange each hand back their
// own `expires_in` — Register and Google OAuth issue shorter-lived tokens
// than Login's 24h/90d, so hardcoding maxAge by flow (or by a rememberMe
// flag) previously left the cookie outliving the token: mobile browsers
// backgrounding/foregrounding the app (see AuthContext's visibilitychange
// check) would find a still-present cookie wrapping an already-expired
// JWT, and every API call would 401 until the interceptor forced a login
// redirect — reading as "the session expired" long before the cookie's
// own deadline.
export function authCookieOptions(expiresInSeconds?: number) {
  const maxAge =
    expiresInSeconds && Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
      ? Math.floor(expiresInSeconds)
      : DEFAULT_MAX_AGE_SECONDS
  return { ...BASE_OPTIONS, maxAge }
}

// base64url → standard base64, padded to a multiple of 4. Browser atob()
// implementations vary in strictness: some (notably older Android WebViews
// and in-app browsers like Facebook/Instagram) throw on unpadded input,
// which previously made isTokenExpired() report "expired" for every valid
// token on those browsers, regardless of its actual lifetime.
function decodeBase64Url(base64url: string): string {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  if (typeof Buffer !== 'undefined') return Buffer.from(padded, 'base64').toString('utf-8')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

/**
 * Decodes the JWT payload and checks whether the token is expired.
 * Works in both Node.js (server) and browser (client) environments.
 * Returns true for malformed tokens (treat as expired).
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payload = JSON.parse(decodeBase64Url(parts[1])) as { exp?: number }
    if (!payload.exp) return false
    return Math.floor(Date.now() / 1000) >= payload.exp
  } catch {
    return true
  }
}
