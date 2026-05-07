// app/api/admins/[id]/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

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

// PUT — cập nhật tài khoản
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin()
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { email, password, name, role } = await req.json()

  const data: any = { email, name, role }
  if (password) data.password = await bcrypt.hash(password, 10)

  try {
    const admin = await prisma.admin.update({
      where: { id: Number(id) },
      data,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })
    return NextResponse.json(admin)
  } catch {
    return NextResponse.json({ error: 'Cập nhật thất bại' }, { status: 400 })
  }
}

// DELETE — xóa tài khoản
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin()
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  // Không cho xóa chính mình
  if (me.id === Number(id)) {
    return NextResponse.json({ error: 'Không thể xóa tài khoản đang đăng nhập' }, { status: 400 })
  }

  await prisma.admin.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
