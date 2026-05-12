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
  if (r < 0.70) return 5   // 70% — 5 sao
  if (r < 0.90) return 4   // 20% — 4 sao
  return 5                  // 10% — 5 sao (tổng 80% là 5 sao, 20% là 4 sao)
}

// Rating hiển thị: đôi khi dùng 4 thay 5 để tự nhiên hơn
// Tỉ lệ thực: ~80% 5 sao, ~20% 4 sao → avg ~4.8

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
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Tạo đúng ${count} đánh giá sản phẩm thật tự nhiên bằng tiếng Việt cho sản phẩm: "${productName}".

Yêu cầu:
- Rating: khoảng 75% là 5 sao, 25% là 4 sao — KHÔNG có 1,2,3 sao
- Comment 1-3 câu ngắn, tự nhiên như người thật nhắn tin, đề cập tên hoặc công dụng sản phẩm
- Tên người Việt Nam thật (họ tên đầy đủ, đa dạng)
- Không dùng từ quá văn vẻ, viết như chat zalo thường ngày
- Đa dạng nội dung: ship nhanh, chất lượng ok, giá ổn, dùng thấy tốt, mua lần 2, tặng người thân...
- Người 4 sao: comment kiểu "ổn nhưng ship hơi lâu", "tốt, chỉ tiếc hộp hơi móp"

Trả về JSON array hợp lệ, KHÔNG có markdown, KHÔNG có text nào khác ngoài JSON:
[{"name":"Nguyễn Thị Lan","rating":5,"comment":"..."},{"name":"Trần Văn Minh","rating":4,"comment":"..."},...]`
      }],
      temperature: 0.85,
    })
  })

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  const clean = text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)
  if (!Array.isArray(parsed)) throw new Error('Not array')
  return parsed
}

function fallbackReviews(productName: string, count: number): { name: string; rating: number; comment: string }[] {
  const templates5 = [
    `Mình mua ${productName} dùng được mấy tuần rồi, chất lượng ổn lắm. Giao hàng nhanh, đóng gói cẩn thận.`,
    `Sản phẩm y như mô tả, dùng thấy tốt. Giá hợp lý so với chất lượng, sẽ mua lại lần sau.`,
    `${productName} dùng ổn, ship nhanh hơn dự kiến. Cảm ơn shop nhé!`,
    `Mua về dùng thử thấy ok, gia đình mình ai cũng thích. Sẽ giới thiệu cho bạn bè.`,
    `Hàng đúng như hình, chất lượng tốt. Đây là lần thứ 2 mình mua rồi, vẫn ưng.`,
    `Giao hàng siêu nhanh, hàng chất lượng. ${productName} dùng rất hài lòng ạ.`,
    `Sản phẩm tốt, giá ok. Shop tư vấn nhiệt tình, sẽ ủng hộ dài dài.`,
    `Dùng thử mấy ngày thấy ổn, không thất vọng. Đáng tiền lắm ạ.`,
    `Mua tặng mẹ, mẹ dùng thích lắm. Hàng chính hãng, yên tâm sử dụng.`,
    `Lần đầu mua thử, thấy ổn quá nên sẽ mua thêm. Ship nhanh, hàng nguyên vẹn.`,
    `${productName} dùng tốt hơn mình nghĩ. Giá này mà chất lượng vậy thì ok rồi.`,
    `Đặt hàng tối, sáng hôm sau đã có hàng. Shop uy tín, sản phẩm đúng như mô tả.`,
    `Mình hay mua đồ online nhưng lần này thấy ưng nhất. ${productName} dùng ok lắm.`,
    `Hàng về nhanh, đóng gói chắc chắn. Dùng thử thấy chất lượng tốt hơn kỳ vọng.`,
    `Shop giao hàng đúng hẹn, sản phẩm đẹp y hình. Rất hài lòng, 5 sao!`,
  ]
  const templates4 = [
    `Sản phẩm ổn, chỉ tiếc ship hơi lâu hơn dự kiến. Nhưng chất lượng thì ok.`,
    `Dùng được, giá hợp lý. Hộp hơi móp nhưng hàng bên trong vẫn nguyên vẹn.`,
    `${productName} dùng tạm ổn, chưa thấy điểm gì nổi bật lắm nhưng đáng tiền.`,
    `Mua về dùng thấy ok, không có gì phàn nàn nhiều. Sẽ xem thêm thời gian rồi đánh giá tiếp.`,
    `Chất lượng tốt, chỉ tiếc màu hơi khác hình 1 chút. Nhìn chung vẫn ổn.`,
  ]

  return Array.from({ length: count }, (_, i) => {
    const is4star = seeded(i * 5 + 3) > 0.75
    const pool = is4star ? templates4 : templates5
    return {
      name: randomName(i * 7 + 13),
      rating: is4star ? 4 : 5,
      comment: pool[i % pool.length],
    }
  })
}

export async function POST(req: NextRequest) {
  const { productId, productName } = await req.json()

  if (!productId || !productName) {
    return NextResponse.json({ error: 'Thiếu productId hoặc productName' }, { status: 400 })
  }

  // Random số lượng 10-20
  const count = Math.floor(Math.random() * 11) + 10

  let reviews: { name: string; rating: number; comment: string }[]

  try {
    reviews = await generateWithGroq(productName, count)
  } catch {
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
