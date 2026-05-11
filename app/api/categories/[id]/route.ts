import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import slugify from 'slugify'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) {
    data.name = body.name
    data.slug = slugify(body.name, { lower: true, locale: 'vi' })
  }
  if ('parentId' in body) {
    data.parentId = body.parentId ? Number(body.parentId) : null
  }
  if ('order' in body) {
    data.order = Number(body.order)
  }

  const cat = await prisma.category.update({
    where: { id: Number(id) },
    data,
  })
  return NextResponse.json(cat)
}
