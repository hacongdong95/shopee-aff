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

// Random discount 30-60%
function randomDiscount() {
  return Math.floor(Math.random() * 31) + 30 // 30 đến 60
}

// Làm tròn giá về đơn vị nghìn đẹp
function roundToThousand(price: number): number {
  return Math.round(price / 1000) * 1000
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

Nhiệm vụ:
1. Làm sạch tên sản phẩm (viết hoa đúng, bỏ ký tự thừa)
2. Xác định danh mục sản phẩm, sau đó ước tính giá bán lẻ hợp lý trên Shopee VN (đơn vị VND, làm tròn đến nghìn). VÍ DỤ: tủ lạnh mini 3.500.000, điện thoại Samsung tầm trung 7.000.000, kem dưỡng da 150.000. TUYỆT ĐỐI không cho giá thấp hơn mức tối thiểu của danh mục.
3. Viết mô tả sản phẩm CỰC KỲ chi tiết theo format bên dưới

Format mô tả (dùng ký hiệu <br> để xuống dòng, KHÔNG dùng ký tự xuống dòng thật):
✅ GIỚI THIỆU SẢN PHẨM:<br>• [2-3 câu giới thiệu hấp dẫn]<br><br>📦 THÔNG TIN CHI TIẾT:<br>• [thông tin 1]<br>• [thông tin 2]<br>• [thông tin 3]<br>• [thông tin 4]<br>• [thông tin 5]<br><br>⚡ CÔNG DỤNG & LỢI ÍCH:<br>• [công dụng 1]<br>• [công dụng 2]<br>• [công dụng 3]<br>• [công dụng 4]<br>• [công dụng 5]<br><br>🎯 HƯỚNG DẪN SỬ DỤNG:<br>• [bước 1]<br>• [bước 2]<br>• [bước 3]<br>• [bước 4]<br><br>💡 LƯU Ý:<br>• [lưu ý 1]<br>• [lưu ý 2]<br>• [lưu ý 3]<br><br>🎁 CAM KẾT CỦA SHOP:<br>• ✔ Hàng chính hãng 100%, có tem chống giả<br>• ✔ Hoàn tiền 100% nếu hàng không đúng mô tả<br>• ✔ Đổi trả miễn phí trong 15 ngày<br>• ✔ Giao hàng nhanh toàn quốc 2-5 ngày<br>• ✔ Hỗ trợ tư vấn 24/7

Trả về JSON duy nhất, KHÔNG markdown, KHÔNG xuống dòng thật trong string:
{"name": "tên sản phẩm", "price": 199000, "description": "mô tả dùng <br>"}`

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
        max_tokens: 1500,
        messages: [
          {
            role: 'system',
            content: `Bạn là chuyên gia định giá sản phẩm thương mại điện tử Việt Nam.
Quy tắc định giá theo danh mục (giá bán lẻ phổ biến trên Shopee VN):
- Điện thoại: 2.000.000 - 25.000.000đ
- Laptop/Máy tính: 8.000.000 - 35.000.000đ
- Tủ lạnh/Máy giặt/Điều hòa: 3.000.000 - 25.000.000đ
- Tivi: 2.000.000 - 20.000.000đ
- Máy lọc nước/Nồi cơm/Quạt/Bếp: 300.000 - 5.000.000đ
- Mỹ phẩm/Skincare: 50.000 - 2.000.000đ
- Thực phẩm/Đồ ăn: 30.000 - 500.000đ
- Quần áo/Giày dép: 50.000 - 1.000.000đ
- Đồ gia dụng nhỏ: 50.000 - 500.000đ
- Đồ chơi trẻ em: 50.000 - 1.000.000đ
- Phụ kiện điện tử: 20.000 - 500.000đ
- Túi xách/Balo: 100.000 - 2.000.000đ
- Đồng hồ: 200.000 - 5.000.000đ
- Sức khỏe/Thực phẩm chức năng: 100.000 - 1.000.000đ
QUAN TRỌNG: Phải xác định đúng danh mục rồi ước tính giá trong khoảng đó. Trả về JSON hợp lệ duy nhất. KHÔNG dùng ký tự xuống dòng thật trong JSON string.`,
          },
          { role: 'user', content: userPrompt },
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
    const matchJson = clean.match(/\{[\s\S]*\}/)
    if (!matchJson) throw new Error('Không tìm thấy JSON')

    let parsed: { name?: string; price?: number; description?: string }
    try {
      parsed = JSON.parse(matchJson[0])
    } catch {
      // Fallback: extract thủ công
      const getName  = matchJson[0].match(/"name"\s*:\s*"([^"]+)"/)
      const getPrice = matchJson[0].match(/"price"\s*:\s*(\d+)/)
      const getDesc  = matchJson[0].match(/"description"\s*:\s*"([\s\S]+?)"(?:\s*[,}])/)
      parsed = {
        name:        getName?.[1]  ?? rawName,
        price:       getPrice      ? Number(getPrice[1]) : 99000,
        description: getDesc?.[1]  ?? '',
      }
    }

    // Giá thị trường từ AI, sau đó giảm 20% để kích thích mua
    const marketPrice = roundToThousand(parsed.price || 99000)
    const price = roundToThousand(marketPrice * 0.8)

    // Giá gốc: random giảm 30-65% so với giá gốc (tức giá gốc cao hơn price)
    const discount = Math.floor(Math.random() * 36) + 30 // 30-65%
    const oldPrice = roundToThousand(price / (1 - discount / 100))

    return NextResponse.json({
      ok: true,
      name:        parsed.name || rawName,
      price,
      oldPrice,
      description: parsed.description || '',
    })

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
