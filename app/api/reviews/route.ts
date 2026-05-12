// app/api/reviews/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId')

  // Nếu có productId → trả về review của sản phẩm đó (cho trang chi tiết)
  if (productId) {
    const reviews = await prisma.review.findMany({
      where: {
        productId: Number(productId),
        isHidden: false,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(reviews)
  }

  // Không có productId → trả về tất cả (cho trang admin)
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

export async function POST(req: NextRequest) {
  const { productId, name, rating, comment } = await req.json()

  if (!productId || !name?.trim() || !rating || !comment?.trim()) {
    return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
  }
  if (comment.trim().length < 10) {
    return NextResponse.json({ error: 'Đánh giá phải ít nhất 10 ký tự' }, { status: 400 })
  }

  const review = await prisma.review.create({
    data: {
      productId: Number(productId),
      name: name.trim(),
      rating: Number(rating),
      comment: comment.trim(),
      isHidden: false,
    },
  })
  return NextResponse.json(review)
}
