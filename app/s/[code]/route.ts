// app/s/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  const link = await prisma.shortLink.findUnique({ where: { code } })
  if (!link) return NextResponse.redirect('https://giadinhsudo.store')

  // Tăng click count
  await prisma.shortLink.update({ where: { code }, data: { clicks: { increment: 1 } } })

  // Redirect về URL đích
  const dest = link.url.startsWith('http') ? link.url : `https://giadinhsudo.store${link.url}`
  return NextResponse.redirect(dest)
}
