// app/api/admin/reviews/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const data: any = {}
  if (typeof body.isHidden === 'boolean') data.isHidden = body.isHidden
  if (typeof body.comment === 'string') data.comment = body.comment.trim()
  const review = await prisma.review.update({ where: { id: Number(id) }, data })
  return NextResponse.json(review)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await prisma.review.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
