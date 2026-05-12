// app/api/reviews/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { name: true } } },
  })
  return NextResponse.json(
    reviews.map(r => ({
      id:          r.id,
      productId:   r.productId,
      productName: r.product.name,
      name:        r.name,
      rating:      r.rating,
      comment:     r.comment,
      isHidden:    r.isHidden,
      createdAt:   r.createdAt,
    }))
  )
}
