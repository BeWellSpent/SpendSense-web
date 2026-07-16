import { cookies } from 'next/headers'
import { TOKEN_COOKIE, isTokenExpired } from '@/lib/auth/token'
import { VerifyEmailContent } from './VerifyEmailContent'

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>
}) {
  const { locale, token } = await params
  const cookieStore = await cookies()
  const jwt = cookieStore.get(TOKEN_COOKIE)?.value
  const isLoggedIn = !!(jwt && !isTokenExpired(jwt))

  return <VerifyEmailContent verificationToken={token} locale={locale} isLoggedIn={isLoggedIn} />
}
