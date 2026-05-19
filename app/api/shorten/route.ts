// app/api/shorten/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const BASE_URL = 'https://giadinhsudo.store'
const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

function randomCode(len = 5) {
  return Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'Thiếu url' }, { status: 400 })

  // Kiểm tra đã tồn tại chưa
  const existing = await prisma.shortLink.findFirst({ where: { url } })
  if (existing) {
    return NextResponse.json({ short: `${BASE_URL}/s/${existing.code}`, code: existing.code })
  }

  // Tạo code mới không trùng
  let code = randomCode()
  let tries = 0
  while (await prisma.shortLink.findUnique({ where: { code } }) && tries < 10) {
    code = randomCode()
    tries++
  }

  await prisma.shortLink.create({ data: { code, url } })
  return NextResponse.json({ short: `${BASE_URL}/s/${code}`, code })
}
