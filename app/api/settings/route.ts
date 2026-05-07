import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const rows = await prisma.setting.findMany()
  const result: Record<string, string> = {}
  for (const row of rows) {
    result[row.key] = row.value
  }
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: Record<string, string> = await req.json()

  for (const [key, value] of Object.entries(body)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }

  revalidatePath('/')
  revalidatePath('/san-pham/[slug]', 'page')

  return NextResponse.json({ ok: true })
}