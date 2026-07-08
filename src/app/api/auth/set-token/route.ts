import { NextRequest, NextResponse } from 'next/server'
import { TOKEN_COOKIE, authCookieOptions } from '@/lib/auth/token'

export async function POST(req: NextRequest) {
  const { token, expiresIn } = await req.json() as { token: string; expiresIn?: number }

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(TOKEN_COOKIE, token, authCookieOptions(expiresIn))
  return res
}
