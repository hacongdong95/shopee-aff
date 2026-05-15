// app/api/reviews/generate/route.ts
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
    const ho  = HO[Math.floor(Math.random() * HO.length)]
    const dem = isNam ? DEM_NAM[Math.floor(Math.random() * DEM_NAM.length)] : DEM_NU[Math.floor(Math.random() * DEM_NU.length)]
    const ten = isNam ? TEN_NAM[Math.floor(Math.random() * TEN_NAM.length)] : TEN_NU[Math.floor(Math.random() * TEN_NU.length)]
    const name = `${ho} ${dem} ${ten}`
    if (!usedNames.has(name)) { usedNames.add(name); return name }
    attempts++
  }
  return `${HO[index % HO.length]} ${isNam ? DEM_NAM[index % DEM_NAM.length] : DEM_NU[index % DEM_NU.length]} ${index}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId, productName, count = 5 } = body

    if (!productId) {
      return NextResponse.json({ error: 'Thiếu productId' }, { status: 400 })
    }

    // Lấy tên sản phẩm từ DB nếu không truyền lên
    let name = productName
    if (!name) {
      const product = await prisma.product.findUnique({ where: { id: Number(productId) } })
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      name = product.name
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY chưa được cấu hình' }, { status: 500 })
    }

    // Chia thành batch 10 để tránh token limit và JSON bị cắt
    const BATCH_SIZE = 10
    const batches = Math.ceil(count / BATCH_SIZE)
    const allReviews: { rating: number; comment: string }[] = []

    for (let b = 0; b < batches; b++) {
      const batchCount = Math.min(BATCH_SIZE, count - b * BATCH_SIZE)

      const prompt = `Tạo đúng ${batchCount} đánh giá sản phẩm thực tế cho sản phẩm: "${name}"

Yêu cầu:
- Rating: 75% là 5 sao, 25% là 4 sao
- Bình luận 1-2 câu ngắn, tự nhiên như người Việt thật viết, đề cập đến sản phẩm
- Đa dạng nội dung: chất lượng, giao hàng, giá cả, dùng thử, mua lần 2
- Viết tiếng Việt tự nhiên, có thể dùng emoji nhẹ
- KHÔNG dùng từ "sản phẩm" nhiều, thay bằng "hàng", "món này", "cái này"

Trả về JSON array, KHÔNG markdown, KHÔNG text thừa, PHẢI đủ ${batchCount} phần tử:
[{"rating":5,"comment":"..."},{"rating":4,"comment":"..."}]`

      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          temperature: 0.85,
          max_tokens: 2000,
          messages: [
            { role: 'system', content: 'Chỉ trả về JSON array thuần túy, không có text hay markdown bao quanh. Đảm bảo JSON hợp lệ và đầy đủ.' },
            { role: 'user', content: prompt },
          ],
        }),
      })

      if (!groqRes.ok) continue

      const groqData = await groqRes.json()
      const text = groqData?.choices?.[0]?.message?.content ?? ''
      const clean = text.replace(/```json|```/g, '').trim()

      // Tìm array JSON, thử parse
      try {
        const match = clean.match(/\[[\s\S]*\]/)
        if (match) {
          const parsed = JSON.parse(match[0])
          if (Array.isArray(parsed)) allReviews.push(...parsed)
        }
      } catch {
        // Batch này lỗi, bỏ qua, tiếp tục batch sau
      }

      // Delay nhỏ giữa các batch tránh rate limit
      if (b < batches - 1) await new Promise(r => setTimeout(r, 1200))
    }

    if (allReviews.length === 0) {
      return NextResponse.json({ error: 'AI không tạo được review nào' }, { status: 500 })
    }

    // Lưu vào DB
    const usedNames = new Set<string>()
    const created = await Promise.all(allReviews.map((r, i) => {
      const reviewName = generateUniqueName(usedNames, i)
      const daysAgo   = Math.floor(Math.random() * 90) + 1
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      return prisma.review.create({
        data: {
          productId: Number(productId),
          name: reviewName,
          rating: Math.min(5, Math.max(1, Number(r.rating) || 5)),
          comment: String(r.comment || '').trim() || 'Sản phẩm tốt!',
          createdAt,
        },
      })
    }))

    return NextResponse.json({ ok: true, count: created.length })

  } catch (e) {
    return NextResponse.json({ error: `Lỗi server: ${String(e)}` }, { status: 500 })
  }
}
