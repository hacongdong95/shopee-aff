import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const review = await prisma.review.update({
      where: { id: Number(id) },
      data: { likes: { increment: 1 } },
    })
    return NextResponse.json({ likes: review.likes })
  } catch {
    return NextResponse.json({ likes: 0 })
  }
}
