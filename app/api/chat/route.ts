import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: 'No message' }, { status: 400 })

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return NextResponse.json({ reply: 'Chức năng tư vấn AI chưa được cấu hình. Vui lòng liên hệ qua Zalo hoặc điện thoại nhé!' })

    // Tìm sản phẩm liên quan đến câu hỏi
    const keywords = message.toLowerCase()
      .replace(/[^\w\sàáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length > 2)
      .slice(0, 5)

    let productContext = ''
    if (keywords.length > 0) {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: keywords.map((kw: string) => ({
            name: { contains: kw, mode: 'insensitive' as const }
          }))
        },
        include: { category: true },
        orderBy: { clicks: 'desc' },
        take: 5,
      })

      if (products.length > 0) {
        productContext = '\n\nSản phẩm hiện có trong shop liên quan:\n' +
          products.map(p => {
            const discount = p.oldPrice && p.oldPrice > p.price
              ? ` (giảm ${Math.round((1 - p.price / p.oldPrice) * 100)}%)`
              : ''
            return `- ${p.name} | Giá: ${p.price.toLocaleString('vi-VN')}đ${discount} | Danh mục: ${p.category.name} | Link: /san-pham/${p.slug}`
          }).join('\n')
      } else {
        productContext = '\n\nShop hiện chưa có sản phẩm phù hợp với yêu cầu này.'
      }
    }

    const systemPrompt = `Bạn là trợ lý tư vấn mua sắm của shop "Gia Đình Su Đô" - website affiliate Shopee.
Nhiệm vụ: Tư vấn khách hàng dựa trên sản phẩm THỰC TẾ trong shop.
Quy tắc:
- Chỉ tư vấn sản phẩm có trong danh sách được cung cấp
- Nếu không có sản phẩm phù hợp, nói thật và gợi ý liên hệ để được hỗ trợ thêm
- Trả lời ngắn gọn, thân thiện bằng tiếng Việt
- Khi giới thiệu sản phẩm, đề cập giá và % giảm nếu có
- Không bịa đặt thông tin sản phẩm không có trong shop${productContext}`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message }
    ]

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 500,
        messages,
      })
    })

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content || 'Xin lỗi, tôi chưa thể trả lời ngay!'
    return NextResponse.json({ reply })
  } catch (e) {
    console.error('Chat error:', e)
    return NextResponse.json({ reply: 'Có lỗi xảy ra. Vui lòng thử lại!' })
  }
}
