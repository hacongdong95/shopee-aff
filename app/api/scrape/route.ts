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

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
        max_tokens: 2000,
        messages: [
          {
            role: 'system',
            content: `Bạn là chuyên gia viết content bán hàng thương mại điện tử Việt Nam. 
Nhiệm vụ: viết mô tả sản phẩm CỰC KỲ chi tiết, hấp dẫn, thuyết phục khách mua hàng.
Phong cách: chuyên nghiệp, có emoji, bullet points rõ ràng, đánh vào tâm lý mua hàng.
Bắt buộc trả về JSON hợp lệ. KHÔNG dùng ký tự xuống dòng thật trong JSON string — thay bằng chuỗi <br>.`,
          },
          {
            role: 'user',
            content: `Sản phẩm: "${rawName}"

Viết mô tả sản phẩm theo format sau, CỰC KỲ CHI TIẾT (ít nhất 15-20 gạch đầu dòng tổng cộng):

✅ GIỚI THIỆU SẢN PHẨM:<br>• [2-3 câu giới thiệu hấp dẫn về sản phẩm]<br><br>📦 THÔNG TIN CHI TIẾT:<br>• [thông tin 1]<br>• [thông tin 2]<br>• [thông tin 3]<br>• [thông tin 4]<br>• [thông tin 5]<br><br>⚡ CÔNG DỤNG & LỢI ÍCH:<br>• [công dụng 1]<br>• [công dụng 2]<br>• [công dụng 3]<br>• [công dụng 4]<br>• [công dụng 5]<br><br>🎯 HƯỚNG DẪN SỬ DỤNG:<br>• [bước 1]<br>• [bước 2]<br>• [bước 3]<br>• [bước 4]<br><br>💡 LƯU Ý KHI SỬ DỤNG:<br>• [lưu ý 1]<br>• [lưu ý 2]<br>• [lưu ý 3]<br><br>🎁 CAM KẾT CỦA SHOP:<br>• ✔ Hàng chính hãng 100%, có tem chống giả<br>• ✔ Hoàn tiền 100% nếu hàng không đúng mô tả<br>• ✔ Đổi trả miễn phí trong 15 ngày<br>• ✔ Giao hàng nhanh toàn quốc 2-5 ngày<br>• ✔ Hỗ trợ tư vấn 24/7

Trả về JSON (dùng <br> thay cho xuống dòng):
{"name": "tên sản phẩm sạch", "price": 199000, "oldPrice": 299000, "description": "toàn bộ mô tả ở trên"}`,
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

    // Parse JSON an toàn
    const clean = text.replace(/```json|```/g, '').trim()
    const matchJson = clean.match(/\{[\s\S]*\}/)
    if (!matchJson) throw new Error('Không tìm thấy JSON trong response')

    // Dùng cách parse thủ công để tránh lỗi ký tự đặc biệt
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(matchJson[0])
    } catch {
      // Nếu vẫn lỗi, thử extract từng field thủ công
      const getName = matchJson[0].match(/"name"\s*:\s*"([^"]+)"/)
      const getPrice = matchJson[0].match(/"price"\s*:\s*(\d+)/)
      const getOldPrice = matchJson[0].match(/"oldPrice"\s*:\s*(\d+|null)/)
      const getDesc = matchJson[0].match(/"description"\s*:\s*"([\s\S]+?)"(?:\s*[,}])/)

      parsed = {
        name: getName?.[1] ?? rawName,
        price: getPrice ? Number(getPrice[1]) : 99000,
        oldPrice: getOldPrice?.[1] && getOldPrice[1] !== 'null' ? Number(getOldPrice[1]) : null,
        description: getDesc?.[1] ?? '',
      }
    }

    return NextResponse.json({ ok: true, ...parsed })

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
