import { NextRequest, NextResponse } from 'next/server'
import { loginAdmin, signToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  const admin = await loginAdmin(email, password)
  if (!admin) {
    return NextResponse.json({ error: 'Sai email hoặc mật khẩu' }, { status: 401 })
  }
  const token = await signToken({ id: admin.id, email: admin.email })
  const cookieStore = await cookies()
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return NextResponse.json({ ok: true })
}
