// app/api/reviews/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const NAMES = [
  'Nguyễn Thị Lan','Trần Văn Minh','Lê Thị Hoa','Phạm Văn Đức','Hoàng Thị Mai',
  'Vũ Văn Hùng','Đặng Thị Thu','Bùi Văn Nam','Đỗ Thị Linh','Ngô Văn Tuấn',
  'Dương Thị Hằng','Lý Văn Khoa','Phan Thị Ngọc','Trịnh Văn Long','Đinh Thị Yến',
  'Cao Văn Bình','Tạ Thị Hương','Lưu Văn Thắng','Vương Thị Diệu','Mai Văn Phúc',
]

function seeded(seed: number) {
  const x = Math.sin(seed) * 10000; return x - Math.floor(x)
}

function randomName(seed: number) {
  return NAMES[Math.floor(seeded(seed) * NAMES.length)]
}

function randomRating(seed: number): number {
  const r = seeded(seed)
  if (r < 0.5) return 5
  if (r < 0.85) return 5
  return 4
}

function randomDate(seed: number): Date {
  const days = Math.floor(seeded(seed) * 90) + 1
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

async function generateWithGroq(productName: string, count: number): Promise<{ name: string; rating: number; comment: string }[]> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('No GROQ_API_KEY')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `Tạo ${count} đánh giá sản phẩm thật tự nhiên bằng tiếng Việt cho sản phẩm: "${productName}".

Yêu cầu:
- Rating từ 4-5 sao (ưu tiên 5 sao)
- Comment 1-3 câu, tự nhiên như người thật viết, đề cập đến sản phẩm cụ thể
- Tên người Việt Nam thật (họ tên đầy đủ)
- Không dùng từ quá formal, viết như chat thường ngày
- Đa dạng nội dung: giao hàng nhanh, chất lượng tốt, giá hợp lý, dùng thử thấy ổn, mua lần 2...

Trả về JSON array (không có markdown):
[{"name":"...","rating":5,"comment":"..."},...]`
      }],
      temperature: 0.9,
    })
  })

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

function fallbackReviews(productName: string, count: number): { name: string; rating: number; comment: string }[] {
  const templates = [
    `Mình mua ${productName} dùng được mấy tuần rồi, chất lượng ổn lắm. Giao hàng nhanh, đóng gói cẩn thận.`,
    `Sản phẩm y như mô tả, dùng thấy tốt. Giá hợp lý so với chất lượng, sẽ mua lại lần sau.`,
    `${productName} dùng ổn, ship nhanh hơn dự kiến. Cảm ơn shop nhé!`,
    `Mua về dùng thử thấy ok, gia đình mình ai cũng thích. Sẽ giới thiệu cho bạn bè.`,
    `Hàng đúng như hình, chất lượng tốt. Đây là lần thứ 2 mình mua rồi, vẫn ưng.`,
    `Giao hàng siêu nhanh, hàng chất lượng. ${productName} dùng rất hài lòng ạ.`,
    `Sản phẩm tốt, giá ok. Shop tư vấn nhiệt tình, sẽ ủng hộ dài dài.`,
    `Dùng thử mấy ngày thấy ổn, không thất vọng. Đáng tiền lắm ạ.`,
  ]
  return Array.from({ length: count }, (_, i) => ({
    name: randomName(i * 7 + 13),
    rating: randomRating(i * 5 + 3),
    comment: templates[i % templates.length],
  }))
}

export async function POST(req: NextRequest) {
  const { productId, productName, count = 7 } = await req.json()

  if (!productId || !productName) {
    return NextResponse.json({ error: 'Thiếu productId hoặc productName' }, { status: 400 })
  }

  let reviews: { name: string; rating: number; comment: string }[]

  try {
    reviews = await generateWithGroq(productName, count)
  } catch {
    // Fallback nếu Groq lỗi
    reviews = fallbackReviews(productName, count)
  }

  // Lưu vào DB với ngày trải đều 3 tháng qua
  const created = await Promise.all(
    reviews.map((r, i) =>
      prisma.review.create({
        data: {
          productId: Number(productId),
          name: r.name || randomName(i + productId),
          rating: Math.min(5, Math.max(4, Number(r.rating) || 5)),
          comment: r.comment || '',
          isHidden: false,
          createdAt: randomDate(i * productId + 7),
        },
      })
    )
  )

  return NextResponse.json({ ok: true, count: created.length })
}
