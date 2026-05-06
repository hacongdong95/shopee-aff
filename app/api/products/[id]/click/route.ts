import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.product.update({
    where: { id: Number(id) },
    data: { clicks: { increment: 1 } },
  })
  return NextResponse.json({ ok: true })
}
