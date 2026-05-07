// app/api/scrape/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

function extractFromUrl(shopeeUrl: string) {
  try {
    const decoded = decodeURIComponent(shopeeUrl)
    const match = decoded.match(/shopee\.vn\/([^?#]+)/)
    if (!match) return ''
    return match[1]
      .replace(/-i\.\d+\.\d+.*$/, '')
      .replace(/-/g, ' ')
      .trim()
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url } = await req.json()
  if (!url || !url.includes('shopee')) {
    return NextResponse.json({ error: 'Link không hợp lệ' }, { status: 400 })
  }

  const rawName = extractFromUrl(url)
  if (!rawName) {
    return NextResponse.json({ error: 'Không parse được tên từ URL' }, { status: 400 })
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: 'Thiếu GROQ_API_KEY' }, { status: 500 })
  }

  const userPrompt = `Tên sản phẩm từ URL Shopee: "${rawName}"

Hãy trả về JSON với các field sau:
- name: tên sản phẩm đã làm sạch (viết hoa đúng)
- price: giá hợp lý VND (số nguyên)
- oldPrice: giá gốc VND hoặc null
- description: mô tả sản phẩm chuyên nghiệp có emoji và bullet points, VIẾT LIỀN TRÊN 1 DÒNG, dùng \\n để xuống dòng

Ví dụ description: "✅ THONG TIN:\\n• Dac diem 1\\n• Dac diem 2\\n\\n🎁 CAM KET:\\n• Hang chinh hang 100%"

Chỉ trả về JSON, không có gì khác.`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 800,
        messages: [
          {
            role: 'system',
            content: 'Bạn là chuyên gia viết mô tả sản phẩm thương mại điện tử Việt Nam. Trả về JSON hợp lệ duy nhất. Trong field description, dùng \\n (backslash-n) để xuống dòng, KHÔNG dùng ký tự xuống dòng thật.',
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Groq lỗi: ${err}` }, { status: 500 })
    }

    const data = await res.json()
    const text: string = data?.choices?.[0]?.message?.content ?? ''

    // Làm sạch JSON: bỏ markdown fence, xử lý ký tự đặc biệt
    const clean = text
      .replace(/```json|```/g, '')
      .trim()

    const matchJson = clean.match(/\{[\s\S]*\}/)
    if (!matchJson) throw new Error('Không tìm thấy JSON')

    // Thay ký tự xuống dòng thật bên trong string thành \n
    const safeJson = matchJson[0].replace(/:\s*"([\s\S]*?)"/g, (_: string, inner: string) => {
      const escaped = inner
        .replace(/\\/g, '\\\\')
        .replace(/\r\n/g, '\\n')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\n')
        .replace(/\t/g, '\\t')
        .replace(/"/g, '\\"')
      return `: "${escaped}"`
    })

    const parsed = JSON.parse(safeJson)
    return NextResponse.json({ ok: true, ...parsed })

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
