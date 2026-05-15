import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import slugify from 'slugify'

export async function GET(req: NextRequest) {
  const cats = await prisma.category.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true } } },
  })
  return NextResponse.json(cats)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { name, parentId } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Tên không được trống' }, { status: 400 })

    const baseSlug = slugify(name.trim(), { lower: true, locale: 'vi', strict: true })
    let slug = baseSlug
    let suffix = 2
    while (await prisma.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`
    }

    const maxOrder = await prisma.category.aggregate({
      where: { parentId: parentId ? Number(parentId) : null },
      _max: { order: true },
    })

    // Fix: reset sequence Postgres nếu bị lệch sau khi import/seed
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"Category"', 'id'), COALESCE((SELECT MAX(id) FROM "Category"), 0) + 1, false)`
    )

    const cat = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        parentId: parentId ? Number(parentId) : null,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    })
    return NextResponse.json(cat)
  } catch (e: any) {
    console.error('POST /api/categories:', e)
    return NextResponse.json({ error: e?.message || 'Lỗi server' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await req.json()
    const deleteChildren = async (parentId: number) => {
      const children = await prisma.category.findMany({ where: { parentId } })
      for (const child of children) await deleteChildren(child.id)
      await prisma.category.deleteMany({ where: { parentId } })
    }
    await deleteChildren(Number(id))
    await prisma.category.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Lỗi server' }, { status: 500 })
  }
}
