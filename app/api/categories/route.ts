import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import slugify from 'slugify'

export async function GET(req: NextRequest) {
  const withTree = req.nextUrl.searchParams.get('tree')

  const cats = await prisma.category.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true } } },
  })

  return NextResponse.json(cats)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, parentId } = await req.json()
  const slug = slugify(name, { lower: true, locale: 'vi' })

  // Lấy order lớn nhất trong cùng cấp
  const maxOrder = await prisma.category.aggregate({
    where: { parentId: parentId ? Number(parentId) : null },
    _max: { order: true },
  })

  const cat = await prisma.category.create({
    data: {
      name,
      slug,
      parentId: parentId ? Number(parentId) : null,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  })
  return NextResponse.json(cat)
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()

  // Đệ quy xóa con trước
  const deleteChildren = async (parentId: number) => {
    const children = await prisma.category.findMany({ where: { parentId } })
    for (const child of children) await deleteChildren(child.id)
    await prisma.category.deleteMany({ where: { parentId } })
  }

  await deleteChildren(Number(id))
  await prisma.category.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
