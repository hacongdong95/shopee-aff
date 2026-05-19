import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: 'No message' }, { status: 400 })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ reply: 'Chức năng tư vấn AI chưa được cấu hình. Vui lòng liên hệ qua Zalo hoặc điện thoại nhé!' })

    const messages = [
      ...(history || []),
      { role: 'user', content: message }
    ]

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: 'Bạn là trợ lý tư vấn mua sắm thân thiện của một website affiliate Shopee. Trả lời ngắn gọn, thân thiện bằng tiếng Việt. Giúp khách hàng chọn sản phẩm phù hợp, so sánh giá, tư vấn mua hàng.',
        messages,
      })
    })

    const data = await res.json()
    const reply = data.content?.[0]?.text || 'Xin lỗi, tôi chưa thể trả lời ngay!'
    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ reply: 'Có lỗi xảy ra. Vui lòng thử lại!' })
  }
}
