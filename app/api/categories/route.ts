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

    // ── Sinh slug unique ──────────────────────────────────
    const baseSlug = slugify(name.trim(), { lower: true, locale: 'vi', strict: true })
    let slug = baseSlug
    let suffix = 2
    while (await prisma.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`
    }

    // ── Kiểm tra tên trùng (Category.name là @unique) ────
    // Nếu trùng tên thì báo lỗi rõ ràng thay vì crash
    const existingName = await prisma.category.findUnique({
      where: { name: name.trim() },
    })
    if (existingName) {
      return NextResponse.json(
        { error: `Danh mục "${name.trim()}" đã tồn tại. Vui lòng đặt tên khác.` },
        { status: 409 }
      )
    }

    // ── Tính order ────────────────────────────────────────
    const maxOrder = await prisma.category.aggregate({
      where: { parentId: parentId ? Number(parentId) : null },
      _max: { order: true },
    })

    // ── Tạo danh mục ─────────────────────────────────────
    // KHÔNG dùng setval — để Postgres tự quản lý sequence
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

    // Bắt lỗi unique từ Prisma (P2002) để trả message thân thiện
    if (e?.code === 'P2002') {
      const field = e?.meta?.target?.[0] || 'field'
      if (field === 'name') {
        return NextResponse.json(
          { error: 'Tên danh mục đã tồn tại. Vui lòng đặt tên khác.' },
          { status: 409 }
        )
      }
      if (field === 'slug') {
        return NextResponse.json(
          { error: 'Slug bị trùng. Hệ thống đang thử lại, vui lòng thêm lại.' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: `Dữ liệu bị trùng (${field}). Vui lòng kiểm tra lại.` },
        { status: 409 }
      )
    }

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
