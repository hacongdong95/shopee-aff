import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: 'No message' }, { status: 400 })

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return NextResponse.json({ reply: 'Chức năng tư vấn AI chưa được cấu hình. Vui lòng liên hệ qua Zalo hoặc điện thoại nhé!' })

    const messages = [
      { role: 'system', content: 'Bạn là trợ lý tư vấn mua sắm thân thiện của một website affiliate Shopee. Trả lời ngắn gọn, thân thiện bằng tiếng Việt. Giúp khách hàng chọn sản phẩm phù hợp, so sánh giá, tư vấn mua hàng.' },
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
        max_tokens: 400,
        messages,
      })
    })

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content || 'Xin lỗi, tôi chưa thể trả lời ngay!'
    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ reply: 'Có lỗi xảy ra. Vui lòng thử lại!' })
  }
}
