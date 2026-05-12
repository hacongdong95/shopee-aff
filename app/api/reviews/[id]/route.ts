// app/api/reviews/[id]/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const review = await prisma.review.update({
    where: { id: Number(id) },
    data: { isHidden: body.isHidden },
  })
  return NextResponse.json(review)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.review.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
