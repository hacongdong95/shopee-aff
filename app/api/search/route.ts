import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() || ''
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || '6'), 10)

  if (q.length < 2) return NextResponse.json([])

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      name: { contains: q, mode: 'insensitive' },
    },
    include: { category: true },
    orderBy: { clicks: 'desc' },
    take: limit,
  })

  return NextResponse.json(products)
}
