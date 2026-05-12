// app/api/products/[id]/generate-reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const GROQ_API_KEY = process.env.GROQ_API_KEY!

const VIETNAMESE_NAMES = [
  'Nguyễn Thị Lan', 'Trần Văn Minh', 'Lê Thị Hoa', 'Phạm Văn Nam', 'Hoàng Thị Mai',
  'Vũ Văn Hùng', 'Đặng Thị Thu', 'Bùi Văn Đức', 'Đỗ Thị Linh', 'Ngô Văn Tuấn',
  'Trịnh Thị Nga', 'Đinh Văn Khoa', 'Lý Thị Phương', 'Phan Văn Tài', 'Mai Thị Hạnh',
  'Tô Văn Long', 'Trương Thị Yến', 'Hồ Văn Bình', 'Lâm Thị Cúc', 'Võ Văn Thắng',
]

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const productId = Number(id)

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const { count = 5 } = await req.json().catch(() => ({}))

  try {
    const prompt = `Tạo ${count} đánh giá sản phẩm thực tế cho sản phẩm: "${product.name}"

Yêu cầu:
- Rating từ 4 đến 5 sao (random, đa dạng, đa số 5 sao)
- Bình luận ngắn tự nhiên như người Việt Nam thật viết (1-3 câu)
- Đề cập cụ thể đến sản phẩm, không chung chung
- Đa dạng: có người khen chất lượng, có người khen giao hàng, có người khen giá, có người so sánh với kỳ vọng
- Viết bằng tiếng Việt tự nhiên, có thể có lỗi chính tả nhỏ, emoji, viết tắt như người thật
- KHÔNG dùng từ "sản phẩm" nhiều lần, thay bằng "món đồ", "hàng", "cái này"...

Trả về JSON array, KHÔNG markdown:
[
  { "rating": 5, "comment": "..." },
  { "rating": 4, "comment": "..." }
]`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.9,
        max_tokens: 1000,
        messages: [
          { role: 'system', content: 'Bạn tạo review sản phẩm fake nhưng thực tế cho website thương mại điện tử Việt Nam. Chỉ trả về JSON array thuần túy.' },
          { role: 'user', content: prompt },
        ],
      }),
    })

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content ?? ''
    const clean = text.replace(/```json|```/g, '').trim()
    const match = clean.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('Không parse được JSON')

    const reviews: { rating: number; comment: string }[] = JSON.parse(match[0])

    // Lưu vào DB với tên ngẫu nhiên và ngày trải rộng trong 3 tháng qua
    const created = await Promise.all(reviews.map((r, i) => {
      const name = VIETNAMESE_NAMES[Math.floor(Math.random() * VIETNAMESE_NAMES.length)]
      const daysAgo = Math.floor(Math.random() * 90) + 1
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      return prisma.review.create({
        data: {
          productId,
          name,
          rating: Math.min(5, Math.max(4, r.rating)),
          comment: r.comment,
          createdAt,
        },
      })
    }))

    return NextResponse.json({ ok: true, count: created.length })
  } catch (e) {
    return NextResponse.json({ error: `Lỗi generate: ${e}` }, { status: 500 })
  }
}
