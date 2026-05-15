import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import slugify from 'slugify'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { name, parentId, icon } = await req.json()

  try {
    const data: any = {}

    if (name !== undefined) {
      data.name = name.trim()
      // Slug mới nếu đổi tên
      const baseSlug = slugify(name.trim(), { lower: true, locale: 'vi', strict: true })
      let slug = baseSlug
      let suffix = 2
      while (true) {
        const existing = await prisma.category.findUnique({ where: { slug } })
        if (!existing || existing.id === Number(id)) break
        slug = `${baseSlug}-${suffix++}`
      }
      data.slug = slug
    }

    if (parentId !== undefined) {
      data.parentId = parentId ? Number(parentId) : null
    }

    if (icon !== undefined) {
      data.icon = icon || null
    }

    const cat = await prisma.category.update({
      where: { id: Number(id) },
      data,
    })
    return NextResponse.json(cat)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Lỗi server' }, { status: 500 })
  }
}
