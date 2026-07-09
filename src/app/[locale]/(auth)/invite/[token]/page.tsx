import { cookies } from 'next/headers'
import { TOKEN_COOKIE, isTokenExpired } from '@/lib/auth/token'
import { InviteAcceptContent } from './InviteAcceptContent'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>
}) {
  const { locale, token } = await params
  const cookieStore = await cookies()
  const jwt = cookieStore.get(TOKEN_COOKIE)?.value
  const isLoggedIn = !!(jwt && !isTokenExpired(jwt))

  return (
    <InviteAcceptContent
      inviteToken={token}
      locale={locale}
      isLoggedIn={isLoggedIn}
      authToken={isLoggedIn ? jwt : undefined}
    />
  )
}
