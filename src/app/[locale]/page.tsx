import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { TOKEN_COOKIE } from '@/lib/auth/token'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const token = (await cookies()).get(TOKEN_COOKIE)
  if (token) redirect(`/${locale}/budgets`)
  return <LandingPage />
}
