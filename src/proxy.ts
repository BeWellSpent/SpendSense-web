import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Exclude api routes, _next internals, static files, and the Google OAuth callback
  matcher: ['/((?!api|_next|auth/callback|.*\\..*).*)'],
}
