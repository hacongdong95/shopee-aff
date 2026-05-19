import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: 'No message' }, { status: 400 })

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return NextResponse.json({ reply: 'Chức năng tư vấn AI chưa được cấu hình. Vui lòng liên hệ qua Zalo hoặc điện thoại nhé!', products: [] })

    // Tìm sản phẩm liên quan — kết hợp keyword TỪ TIN NHẮN + category match
    const keywords = message.toLowerCase()
      .replace(/[^\w\sàáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length > 1)
      .slice(0, 8)

    // Lấy tất cả categories để match
    const categories = await prisma.category.findMany({ select: { id: true, name: true, slug: true } })

    // Tìm category khớp keyword
    const matchedCatIds = categories
      .filter(c => keywords.some(kw => c.name.toLowerCase().includes(kw) || kw.includes(c.name.toLowerCase().split(' ')[0])))
      .map(c => c.id)

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          // Match tên sản phẩm
          ...keywords.map((kw: string) => ({
            name: { contains: kw, mode: 'insensitive' as const }
          })),
          // Match danh mục
          ...(matchedCatIds.length > 0 ? [{ categoryId: { in: matchedCatIds } }] : []),
        ]
      },
      include: { category: true },
      orderBy: { clicks: 'desc' },
      take: 6,
    })

    // Build context cho AI
    const productContext = products.length > 0
      ? '\n\nSản phẩm trong shop phù hợp:\n' + products.map(p => {
          const discount = p.oldPrice && p.oldPrice > p.price
            ? ` (-${Math.round((1 - p.price / p.oldPrice) * 100)}%)`
            : ''
          return `- "${p.name}" | ${p.price.toLocaleString('vi-VN')}đ${discount} | Danh mục: ${p.category.name}`
        }).join('\n')
      : '\n\nShop hiện chưa có sản phẩm phù hợp với yêu cầu này.'

    const systemPrompt = `Bạn là trợ lý tư vấn mua sắm của shop "Gia Đình Su Đô" - website affiliate Shopee.
Nhiệm vụ: Tư vấn khách dựa trên sản phẩm THỰC TẾ trong shop bên dưới.
Quy tắc:
- Chỉ tư vấn sản phẩm có trong danh sách được cung cấp, KHÔNG bịa thêm
- Nếu shop không có hàng, nói thật và gợi ý liên hệ
- Trả lời ngắn gọn 2-3 câu, thân thiện tiếng Việt
- Đề cập tên sản phẩm, giá và % giảm nếu có
- Các sản phẩm gợi ý sẽ hiện dưới dạng card tự động, không cần liệt kê link${productContext}`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message }
    ]

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 400,
        messages,
      })
    })

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content || 'Xin lỗi, tôi chưa thể trả lời ngay!'

    // Trả về cả products để ChatBot render card
    const productCards = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      oldPrice: p.oldPrice,
      imageUrl: p.imageUrl?.split('\n')[0]?.trim() || null,
      category: p.category.name,
    }))

    return NextResponse.json({ reply, products: productCards })
  } catch (e) {
    console.error('Chat error:', e)
    return NextResponse.json({ reply: 'Có lỗi xảy ra. Vui lòng thử lại!', products: [] })
  }
}

