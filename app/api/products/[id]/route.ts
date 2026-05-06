import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const product = await prisma.product.update({
    where: { id: Number(id) },
    data: {
      name: body.name,
      description: body.description || null,
      price: Number(body.price),
      oldPrice: body.oldPrice ? Number(body.oldPrice) : null,
      imageUrl: body.imageUrl || null,
      affLink: body.affLink,
      categoryId: Number(body.categoryId),
      isActive: body.isActive ?? true,
    },
  })
  return NextResponse.json(product)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.product.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
