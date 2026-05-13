// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Không có file' }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'admin')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const urls: string[] = []

    for (const file of files) {
      const bytes  = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const ext    = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const name   = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const dest   = path.join(uploadDir, name)
      await writeFile(dest, buffer)
      urls.push(`/uploads/admin/${name}`)
    }

    return NextResponse.json({ urls })
  } catch (e) {
    return NextResponse.json({ error: `Upload thất bại: ${e}` }, { status: 500 })
  }
}
