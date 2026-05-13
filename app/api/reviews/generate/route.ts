// app/api/products/[id]/generate-reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const GROQ_API_KEY = process.env.GROQ_API_KEY!

const HO = ['Nguyễn','Trần','Lê','Phạm','Hoàng','Vũ','Đặng','Bùi','Đỗ','Ngô','Trịnh','Đinh','Lý','Phan','Mai','Tô','Trương','Hồ','Lâm','Võ','Cao','Tạ','Lưu','Vương','Dương','Hà','Từ','Thái','Quách','Bạch','Đoàn','Liêu','Tăng','Châu','Dư','Khuất','Mạc','Nghiêm','Ông','Sầm']
const TEN_NAM = ['Minh','Nam','Hùng','Đức','Tuấn','Khoa','Long','Bình','Thắng','Tài','Phúc','Dũng','Quân','Hải','Sơn','Toàn','Việt','Trung','Hiếu','Lâm','Tùng','Đạt','Kiên','Cường','Nhân','Phong','Quang','Khải','Duy','Hưng','Khánh','Lộc','Nghĩa','Thịnh','Tiến','Tú','Uy','Vũ','Xuân','Yên']
const TEN_NU = ['Lan','Hoa','Mai','Thu','Linh','Yến','Ngọc','Cúc','Hằng','Phương','Hạnh','Loan','Thảo','Dung','Trang','Nhung','Ly','My','Nhi','Xuân','Ánh','Bích','Chi','Diệp','Giang','Hương','Khanh','Liễu','Nga','Oanh','Quỳnh','Như','Thúy','Tuyết','Uyên','Vân','Xuyên','Ý','Châu','Đào']
const DEM_NAM = ['Văn','Anh','Đức','Hữu','Quốc','Công','Bá','Trọng','Mạnh','Gia','Chí','Hoàng','Minh','Ngọc','Phú','Quang','Thành','Thiện','Tiến','Xuân']
const DEM_NU = ['Thị','Ngọc','Thanh','Thúy','Thu','Hồng','Bích','Ánh','Kim','Mỹ','Diễm','Hồng','Lan','Lệ','Minh','Ngân','Phương','Quỳnh','Tú','Ý']

function generateUniqueName(usedNames: Set<string>, index: number): string {
  const isNam = (index % 3 !== 0)
  let attempts = 0
  while (attempts < 100) {
    const ho = HO[Math.floor(Math.random() * HO.length)]
    const dem = isNam ? DEM_NAM[Math.floor(Math.random() * DEM_NAM.length)] : DEM_NU[Math.floor(Math.random() * DEM_NU.length)]
    const ten = isNam ? TEN_NAM[Math.floor(Math.random() * TEN_NAM.length)] : TEN_NU[Math.floor(Math.random() * TEN_NU.length)]
    const name = `${ho} ${dem} ${ten}`
    if (!usedNames.has(name)) { usedNames.add(name); return name }
    attempts++
  }
  return `${HO[index % HO.length]} ${isNam ? DEM_NAM[index % DEM_NAM.length] : DEM_NU[index % DEM_NU.length]} ${index}`
}

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
    const usedNames = new Set<string>()
    const created = await Promise.all(reviews.map((r, i) => {
      const name = generateUniqueName(usedNames, i)
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
