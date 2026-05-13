import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import slugify from 'slugify'

export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(products)
}

// ── Groq generate reviews ─────────────────────────────────────────────────────
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x)
}

const VN_NAMES = [
  'Nguyễn Thị Lan','Trần Văn Hùng','Lê Thị Mai','Phạm Văn Đức','Hoàng Thị Hoa',
  'Vũ Văn Nam','Đặng Thị Thu','Bùi Văn Tùng','Đỗ Thị Linh','Ngô Văn Minh',
  'Trương Thị Ngọc','Đinh Văn Khoa','Lý Thị Hương','Phan Văn Thắng','Mai Thị Yến',
  'Tô Văn Bình','Cao Thị Dung','Dương Văn Long','Hà Thị Phương','Lương Văn Cường',
]

function randomName(seed: number) {
  return VN_NAMES[Math.floor(seededRandom(seed) * VN_NAMES.length)]
}

function randomDaysAgo(seed: number): Date {
  const days = Math.floor(seededRandom(seed) * 90) + 1
  const d = new Date(); d.setDate(d.getDate() - days); return d
}

// Rút gọn tên sản phẩm thành tên chung (bỏ brand, spec cụ thể)
function simplifyProductName(name: string): string {
  // Bỏ các từ trong ngoặc, ký tự đặc biệt, chỉ lấy loại sản phẩm chung
  const cleaned = name
    .replace(/\[.*?\]/g, '')      // bỏ [Hỏa tốc], [Chính hãng]...
    .replace(/\(.*?\)/g, '')      // bỏ (8GB/128GB)...
    .replace(/\d+GB|\d+g|\d+ml|\d+L/gi, '') // bỏ dung lượng
    .replace(/[^\w\sÀ-ỹ]/g, ' ') // bỏ ký tự đặc biệt
    .trim()

  // Lấy 2-3 từ đầu thôi (tên loại sản phẩm)
  const words = cleaned.split(/\s+/).filter(Boolean)
  
  // Các keyword chung thay thế
  const keywordMap: Record<string, string> = {
    'tai nghe': 'tai nghe', 'điện thoại': 'điện thoại', 'laptop': 'laptop',
    'sữa': 'sản phẩm', 'trà': 'trà', 'cà phê': 'cà phê', 'bánh': 'bánh',
    'son': 'son môi', 'kem': 'kem dưỡng', 'serum': 'serum',
    'áo': 'áo', 'quần': 'quần', 'giày': 'giày', 'túi': 'túi',
    'nồi': 'nồi', 'chảo': 'chảo', 'máy': 'máy',
  }
  
  const lower = cleaned.toLowerCase()
  for (const [key, val] of Object.entries(keywordMap)) {
    if (lower.includes(key)) return val
  }
  
  return words.slice(0, 2).join(' ') || 'sản phẩm'
}

async function generateReviews(productName: string, productId: number, count = 5) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY
  const simpleName = simplifyProductName(productName)
  
  const fallbackComments = [
    `Shop giao hàng nhanh, ${simpleName} dùng ổn lắm. Mua về là thấy ưng liền 👍`,
    `Đóng gói cẩn thận, ${simpleName} chất lượng tốt. Giá hợp lý so với chất lượng.`,
    `Lần đầu mua thử, ${simpleName} dùng được. Ship nhanh hơn dự kiến.`,
    `Hàng y hình, dùng ${simpleName} thấy ổn. Mua lần 2 rồi vì lần trước tốt.`,
    `Giao hàng đúng hẹn, ${simpleName} đúng như mô tả. Hài lòng, sẽ ủng hộ shop.`,
    `Mua cho người thân dùng, họ khen ok. Sẽ quay lại mua thêm.`,
    `Chất lượng tốt, giá phải chăng. Shop tư vấn nhiệt tình.`,
    `Dùng 1 tuần thấy ổn, không vấn đề gì. Đáng tiền lắm.`,
  ]

  const fallback = Array.from({ length: count }, (_, i) => ({
    name: randomName(productId * 100 + i),
    rating: seededRandom(productId * 7 + i) < 0.7 ? 5 : 4,
    comment: fallbackComments[(productId + i) % fallbackComments.length],
    createdAt: randomDaysAgo(productId * 13 + i),
  }))

  if (!GROQ_API_KEY) return fallback

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.85,
        max_tokens: 600,
        messages: [
          {
            role: 'system',
            content: `Bạn là người Việt Nam viết review mua hàng online. Viết TỰ NHIÊN, NGẮN, không AI, không hoa mỹ. 
Chỉ đề cập tên loại sản phẩm chung (ví dụ: "trà", "tai nghe", "kem dưỡng") - KHÔNG nhắc tên thương hiệu hay thông số kỹ thuật cụ thể.
Chỉ trả về JSON array thuần túy.`,
          },
          {
            role: 'user',
            content: `Viết ${count} review cho "${simpleName}" (loại sản phẩm từ "${productName}").

Yêu cầu:
- 1-2 câu ngắn, tự nhiên như người bình thường viết trên Shopee
- Đề cập: giao hàng, đóng gói, chất lượng, giá trị, trải nghiệm dùng
- KHÔNG nhắc tên thương hiệu, KHÔNG nhắc thông số kỹ thuật
- Dùng từ đời thường: "ship nhanh", "ok lắm", "ổn", "đáng tiền", "mua lại"
- Rating: 70% là 5 sao, 30% là 4 sao

Trả về JSON array:
[{"rating":5,"comment":"..."},{"rating":4,"comment":"..."},...]`,
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return fallback

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content ?? ''
    const match = text.replace(/```json|```/g, '').trim().match(/\[[\s\S]*\]/)
    if (!match) return fallback

    const parsed = JSON.parse(match[0]) as { rating: number; comment: string }[]
    return parsed.slice(0, count).map((r, i) => ({
      name: randomName(productId * 100 + i),
      rating: Math.min(5, Math.max(4, r.rating)),
      comment: r.comment,
      createdAt: randomDaysAgo(productId * 13 + i),
    }))
  } catch {
    return fallback
  }
}

// ── POST: Tạo sản phẩm + auto generate reviews ───────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const slug = slugify(body.name, { lower: true, locale: 'vi' }) + '-' + Date.now()

  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug,
      description: body.description || null,
      price: Number(body.price),
      oldPrice: body.oldPrice ? Number(body.oldPrice) : null,
      imageUrl: body.imageUrl || null,
      affLink: body.affLink,
      categoryId: Number(body.categoryId),
      isActive: body.isActive ?? true,
    },
  })

  // Generate reviews async (không block response)
  generateReviews(product.name, product.id, 5).then(async (reviews) => {
    try {
      await prisma.review.createMany({
        data: reviews.map(r => ({
          productId: product.id,
          name: r.name,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
        })),
      })
    } catch (e) {
      console.error('Generate reviews failed:', e)
    }
  })

  return NextResponse.json(product)
}
