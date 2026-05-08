// app/api/reviews/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const review = await prisma.review.update({
    where: { id: Number(id) },
    data: { likes: { increment: 1 } },
  })
  return NextResponse.json({ likes: review.likes })
}
