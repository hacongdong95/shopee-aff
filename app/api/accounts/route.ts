import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admins = await prisma.admin.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(admins)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { email, password, name, role } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'Thiếu email hoặc mật khẩu' }, { status: 400 })
  const hashed = await bcrypt.hash(password, 10)
  const admin = await prisma.admin.create({
    data: { email, password: hashed, name: name || null, role: role || 'admin' },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  })
  return NextResponse.json(admin)
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, email, password, name, role } = await req.json()
  const data: any = { email, name: name || null, role: role || 'admin' }
  if (password) data.password = await bcrypt.hash(password, 10)
  const admin = await prisma.admin.update({
    where: { id: Number(id) },
    data,
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  })
  return NextResponse.json(admin)
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await prisma.admin.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
