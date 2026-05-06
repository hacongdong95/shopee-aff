import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import slugify from 'slugify'

export async function GET() {
  const cats = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(cats)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()
  const slug = slugify(name, { lower: true, locale: 'vi' })
  const cat = await prisma.category.create({ data: { name, slug } })
  return NextResponse.json(cat)
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  await prisma.category.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
