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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: any = {}
  if (body.isHidden !== undefined) data.isHidden = body.isHidden
  if (body.comment !== undefined) data.comment = body.comment
  if (body.name !== undefined) data.name = body.name
  if (body.rating !== undefined) data.rating = Number(body.rating)
  const review = await prisma.review.update({
    where: { id: Number(id) },
    data,
  })
  return NextResponse.json(review)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.review.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
