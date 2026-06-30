import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { TOKEN_COOKIE } from '@/lib/auth/token'

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const token = (await cookies()).get(TOKEN_COOKIE)
  redirect(token ? `/${locale}/budgets` : `/${locale}/login`)
}
