// app/api/products/[id]/generate-reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const GROQ_API_KEY = process.env.GROQ_API_KEY!

// Ho va ten rieng de ghep ngau nhien -> it bi trung hon
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
  'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Mai', 'Trịnh', 'Tô',
  'Trương', 'Lâm', 'Hà', 'Cao', 'Đào', 'Tạ', 'Đoàn', 'Vương', 'Châu', 'Thái']

const TEN_NAM = ['Minh', 'Hùng', 'Đức', 'Tuấn', 'Nam', 'Khoa', 'Tài', 'Long', 'Bình', 'Thắng',
  'Dũng', 'Quân', 'Huy', 'Phong', 'Hiếu', 'Đạt', 'Thịnh', 'Kiên', 'Mạnh', 'Sơn',
  'Tùng', 'Đông', 'Quang', 'Nhật', 'Trung', 'Khôi', 'Lâm', 'Phúc', 'Bảo', 'Gia Huy']

const TEN_NU = ['Lan', 'Hoa', 'Mai', 'Thu', 'Linh', 'Nga', 'Phương', 'Hạnh', 'Yến', 'Cúc',
  'Trang', 'Thảo', 'Hương', 'Ngọc', 'Nhung', 'Diễm', 'Thanh', 'Hiền', 'Vân', 'Loan',
  'Hằng', 'Trúc', 'Quỳnh', 'Ly', 'Nhi', 'Thy', 'Vy', 'Bích', 'Châu', 'Kim Anh']

const DEM_NAM = ['Văn', 'Quốc', 'Anh', 'Đình', 'Công', 'Hữu', 'Gia', 'Tiến', 'Trọng', 'Ngọc']
const DEM_NU = ['Thị', 'Ngọc', 'Thúy', 'Kim', 'Thanh', 'Mỹ', 'Bích', 'Như', 'Phương', 'Thùy']

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateVietnameseName(usedNames: Set<string>, attempt = 0): string {
  const isFemale = Math.random() > 0.45
  const ho = randomItem(HO)
  const dem = isFemale ? randomItem(DEM_NU) : randomItem(DEM_NAM)
  const ten = isFemale ? randomItem(TEN_NU) : randomItem(TEN_NAM)
  // Doi khi bo dem de tu nhien hon
  const name = Math.random() > 0.3 ? `${ho} ${dem} ${ten}` : `${ho} ${ten}`
  if (usedNames.has(name) && attempt < 10) return generateVietnameseName(usedNames, attempt + 1)
  usedNames.add(name)
  return name
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
    // Lay ten da dung de tranh trung
    const existingNames = await prisma.review.findMany({
      where: { productId },
      select: { name: true },
    })
    const usedNames = new Set(existingNames.map(r => r.name))

    const created = await Promise.all(reviews.map((r, i) => {
      const name = generateVietnameseName(usedNames)
      // Ngay trai deu trong 3 thang, khong de ngay lien tiep
      const daysAgo = Math.floor(Math.random() * 85) + 2
      const hoursOffset = Math.floor(Math.random() * 18) + 6 // 6am-12am
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      createdAt.setHours(hoursOffset, Math.floor(Math.random() * 60), 0)
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
