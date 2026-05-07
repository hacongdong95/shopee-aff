// app/api/scrape/route.ts
// POST /api/scrape  — nhận link Shopee, trả về thông tin sản phẩm

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
    return NextResponse.json({ error: 'Thiếu GROQ_API_KEY trong .env' }, { status: 500 })
  }

  const userPrompt = `Tên sản phẩm thô từ URL Shopee: "${rawName}"
Link: ${url}

Hãy:
1. Làm sạch tên sản phẩm (viết hoa đúng, bỏ ký tự thừa)
2. Đoán giá hợp lý tại thị trường Việt Nam (số nguyên VND)
3. Đoán giá gốc nếu có thể (hoặc null)
4. Viết mô tả sản phẩm THEO ĐÚNG FORMAT bên dưới, có emoji sticker, tiêu đề in hoa, bullet points như Shopee thật:

✅ THÔNG TIN SẢN PHẨM:
• [đặc điểm nổi bật 1]
• [đặc điểm nổi bật 2]
• [đặc điểm nổi bật 3]

✅ ƯU ĐIỂM NỔI BẬT:
• [ưu điểm 1]
• [ưu điểm 2]
• [ưu điểm 3]

🎁 CAM KẾT CỦA SHOP:
• Hàng chính hãng 100%
• Hoàn tiền nếu hàng không đúng mô tả
• Đổi trả miễn phí trong 15 ngày

Trả về JSON duy nhất, KHÔNG markdown:
{
  "name": "tên sản phẩm sạch",
  "price": 199000,
  "oldPrice": 299000,
  "description": "mô tả theo format trên, dùng ký tự xuống dòng thật"
}`

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
            content: 'Bạn là chuyên gia viết mô tả sản phẩm thương mại điện tử Việt Nam. Viết mô tả chuyên nghiệp, hấp dẫn, có emoji, bullet points. Chỉ trả về JSON thuần túy, không có text thừa, không markdown fence.',
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
    const clean = text.replace(/```json|```/g, '').trim()
    const match = clean.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Không parse được JSON')

    const parsed = JSON.parse(match[0])
    return NextResponse.json({ ok: true, ...parsed })

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
