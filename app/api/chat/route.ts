// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const GROQ_API_KEY = process.env.GROQ_API_KEY!

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionProducts } = await req.json()

    // Lấy danh sách sản phẩm từ DB (tối đa 80 để không quá context)
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { clicks: 'desc' },
      take: 80,
    })

    const productList = products.map(p => {
      const disc = p.oldPrice && p.oldPrice > p.price
        ? Math.round((1 - p.price / p.oldPrice) * 100) : 0
      return `- ID:${p.id} | ${p.name} | Danh mục: ${p.category.name} | Giá: ${p.price.toLocaleString('vi-VN')}đ${p.oldPrice ? ` (gốc ${p.oldPrice.toLocaleString('vi-VN')}đ, -${disc}%)` : ''} | slug: ${p.slug}`
    }).join('\n')

    const systemPrompt = `Bạn là trợ lý tư vấn mua sắm của website affiliate Shopee. Nhiệm vụ của bạn là giúp khách hàng tìm sản phẩm phù hợp với nhu cầu.

DANH SÁCH SẢN PHẨM HIỆN CÓ:
${productList}

HƯỚNG DẪN:
- Trả lời bằng tiếng Việt, thân thiện, ngắn gọn (tối đa 3-4 câu)
- Khi gợi ý sản phẩm, LUÔN dùng format: [TÊN SẢN PHẨM](slug) để tôi tạo link
- Gợi ý tối đa 3 sản phẩm phù hợp nhất
- Nếu không có sản phẩm phù hợp, nói thật và hỏi thêm nhu cầu
- Không bịa ra sản phẩm không có trong danh sách
- Ưu tiên sản phẩm giảm giá nhiều và phù hợp ngân sách khách hỏi
- Hỏi thêm nếu cần: ngân sách, mục đích sử dụng, đối tượng dùng`

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    })

    if (!groqRes.ok) {
      return NextResponse.json({ error: 'AI tạm thời không khả dụng' }, { status: 500 })
    }

    const data = await groqRes.json()
    const reply = data.choices?.[0]?.message?.content || 'Xin lỗi, tôi chưa hiểu ý bạn. Bạn có thể nói rõ hơn không?'

    // Extract product slugs từ reply để trả về links
    const slugMatches = [...reply.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)]
    const suggestedSlugs = slugMatches.map(m => m[2])
    const suggestedProducts = products
      .filter(p => suggestedSlugs.includes(p.slug))
      .map(p => ({
        id: p.id, name: p.name, slug: p.slug,
        price: p.price, oldPrice: p.oldPrice,
        imageUrl: p.imageUrl?.split('\n')[0]?.trim() || null,
        category: p.category.name,
      }))

    // Clean reply — xóa markdown links, giữ text
    const cleanReply = reply.replace(/\[([^\]]+)\]\([^)]+\)/g, '**$1**')

    return NextResponse.json({ reply: cleanReply, products: suggestedProducts })
  } catch (e) {
    return NextResponse.json({ error: `Lỗi: ${e}` }, { status: 500 })
  }
}
