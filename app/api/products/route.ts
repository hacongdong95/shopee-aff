import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import slugify from 'slugify'

export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const slug = slugify(body.name, { lower: true, locale: 'vi' }) + '-' + Date.now()

  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug,
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
