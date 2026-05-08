// app/api/admin/reviews/unread/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ count: 0 })
  const count = await prisma.review.count({ where: { isHidden: false } })
  return NextResponse.json({ count })
}
