// app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reviews?productId=123
export async function GET(req: NextRequest) {
  const productId = Number(req.nextUrl.searchParams.get('productId'))
  if (!productId) return NextResponse.json([], { status: 200 })

  const reviews = await prisma.review.findMany({
    where: { productId, isHidden: false },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, rating: true, comment: true, createdAt: true },
  })

  return NextResponse.json(reviews)
}

// POST /api/reviews
export async function POST(req: NextRequest) {
  try {
    const { productId, name, rating, comment } = await req.json()

    if (!productId || !name?.trim() || !rating || !comment?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
    }
    if (comment.trim().length < 10) {
      return NextResponse.json({ error: 'Comment too short' }, { status: 400 })
    }

    const review = await prisma.review.create({
      data: {
        productId: Number(productId),
        name: name.trim(),
        rating: Number(rating),
        comment: comment.trim(),
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (err) {
    console.error('Review POST error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
