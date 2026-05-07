// app/api/admins/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

// Kiểm tra đang là ADMIN (không phải editor)
async function requireAdmin() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')?.value
  if (!session) return null
  try {
    const { id } = JSON.parse(Buffer.from(session, 'base64').toString())
    const admin = await prisma.admin.findUnique({ where: { id } })
    if (!admin || admin.role !== 'admin') return null
    return admin
  } catch { return null }
}

// GET — lấy danh sách tài khoản
export async function GET() {
  const me = await requireAdmin()
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admins = await prisma.admin.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(admins)
}

// POST — tạo tài khoản mới
export async function POST(req: NextRequest) {
  const me = await requireAdmin()
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, password, name, role } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'Thiếu email hoặc mật khẩu' }, { status: 400 })

  const hashed = await bcrypt.hash(password, 10)
  try {
    const admin = await prisma.admin.create({
      data: { email, password: hashed, name: name || '', role: role || 'editor' },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })
    return NextResponse.json(admin)
  } catch {
    return NextResponse.json({ error: 'Email đã tồn tại' }, { status: 400 })
  }
}
