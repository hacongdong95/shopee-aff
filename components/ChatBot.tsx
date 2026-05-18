'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

type Message = {
  role: 'user' | 'assistant'
  content: string
  products?: {
    id: number; name: string; slug: string
    price: number; oldPrice: number | null
    imageUrl: string | null; category: string
  }[]
}

const QUICK_QUESTIONS = [
  '🎁 Quà tặng dưới 200k',
  '🏠 Đồ gia dụng hot',
  '💊 Thực phẩm sức khỏe',
  '📱 Điện tử giảm mạnh',
]

export default function ChatBot({ primary = '#ee4d2d' }: { primary?: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Xin chào! 👋 Mình là trợ lý tư vấn mua sắm. Bạn đang tìm kiếm sản phẩm gì? Mình sẽ gợi ý những deal tốt nhất cho bạn!',
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (!open && messages[messages.length - 1]?.role === 'assistant' && messages.length > 1) {
      setUnread(n => n + 1)
    }
  }, [messages])

  const send = async (text?: string) => {
    const content = text || input.trim()
    if (!content || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || 'Xin lỗi, có lỗi xảy ra. Bạn thử lại nhé!',
        products: data.products || [],
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Xin lỗi, mình đang gặp sự cố. Bạn thử lại sau nhé! 🙏',
      }])
    } finally {
      setLoading(false)
    }
  }

  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <>
      <style>{`
        .chat-bubble{animation:chat-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards}
        @keyframes chat-pop{from{transform:scale(0.8) translateY(10px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
        .chat-box{animation:chat-slide 0.25s ease forwards}
        @keyframes chat-slide{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
        .msg-in{animation:msg-in 0.2s ease forwards}
        @keyframes msg-in{from{transform:translateX(-8px);opacity:0}to{transform:translateX(0);opacity:1}}
        .msg-out{animation:msg-out 0.2s ease forwards}
        @keyframes msg-out{from{transform:translateX(8px);opacity:0}to{transform:translateX(0);opacity:1}}
        .chat-input:focus{outline:none;border-color:${primary}!important}
        .quick-btn:hover{background:${primary}!important;color:white!important}
        .product-card-chat:hover{border-color:${primary}!important}
        .send-btn:hover{opacity:0.85}
        .chat-scroll::-webkit-scrollbar{width:4px}
        .chat-scroll::-webkit-scrollbar-track{background:transparent}
        .chat-scroll::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:4px}
      `}</style>

      {/* Nút chat nổi */}
      <div style={{ position:'fixed', bottom:24, right:20, zIndex:9998 }}>
        {!open && unread > 0 && (
          <div style={{ position:'absolute', top:-6, right:-6, background:'#ef4444', color:'white', fontSize:10, fontWeight:800, width:18, height:18, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
            {unread}
          </div>
        )}
        <button
          onClick={() => setOpen(o => !o)}
          className="chat-bubble"
          style={{
            width:52, height:52, borderRadius:'50%', border:'none',
            background: open ? '#6b7280' : `linear-gradient(135deg, ${primary}, ${primary}cc)`,
            color:'white', fontSize:22, cursor:'pointer',
            boxShadow:`0 4px 20px ${primary}55`, display:'flex', alignItems:'center', justifyContent:'center',
            transition:'background 0.2s',
          }}
          title="Tư vấn mua sắm"
        >
          {open ? '✕' : '💬'}
        </button>
      </div>

      {/* Chat box */}
      {open && (
        <div className="chat-box" style={{
          position:'fixed', bottom:86, right:20, zIndex:9997,
          width:340, height:500, background:'white',
          borderRadius:16, boxShadow:'0 8px 40px rgba(0,0,0,0.15)',
          display:'flex', flexDirection:'column', overflow:'hidden',
          border:'1px solid #f0f0f0',
        }}>
          {/* Header */}
          <div style={{ background:`linear-gradient(135deg, ${primary}, ${primary}cc)`, padding:'14px 16px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🤖</div>
            <div>
              <div style={{ color:'white', fontWeight:700, fontSize:14 }}>Trợ lý mua sắm</div>
              <div style={{ color:'rgba(255,255,255,0.8)', fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block' }} />
                Đang hoạt động
              </div>
            </div>
            <button onClick={() => setMessages([messages[0]])} title="Xóa lịch sử"
              style={{ marginLeft:'auto', background:'rgba(255,255,255,0.15)', border:'none', color:'white', borderRadius:8, padding:'4px 8px', fontSize:11, cursor:'pointer' }}>
              🗑 Xóa
            </button>
          </div>

          {/* Messages */}
          <div className="chat-scroll" style={{ flex:1, overflowY:'auto', padding:'12px 12px 4px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom:12 }}>
                <div className={m.role === 'user' ? 'msg-out' : 'msg-in'} style={{
                  display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap:8, alignItems:'flex-end',
                }}>
                  {m.role === 'assistant' && (
                    <div style={{ width:28, height:28, borderRadius:'50%', background:`${primary}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>🤖</div>
                  )}
                  <div style={{
                    maxWidth:'80%', padding:'9px 13px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: m.role === 'user' ? primary : '#f3f4f6',
                    color: m.role === 'user' ? 'white' : '#1a1a1a',
                    fontSize:13, lineHeight:1.5,
                  }}
                    dangerouslySetInnerHTML={{ __html: formatContent(m.content) }}
                  />
                </div>

                {/* Product cards gợi ý */}
                {m.products && m.products.length > 0 && (
                  <div style={{ marginTop:8, marginLeft:36, display:'flex', flexDirection:'column', gap:6 }}>
                    {m.products.map(p => {
                      const disc = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : null
                      return (
                        <Link key={p.id} href={`/san-pham/${p.slug}`} className="product-card-chat"
                          style={{ display:'flex', gap:8, padding:'8px 10px', background:'white', borderRadius:10, border:'1.5px solid #f0f0f0', textDecoration:'none', transition:'border-color 0.15s' }}>
                          <div style={{ width:44, height:44, borderRadius:8, overflow:'hidden', flexShrink:0, background:'#fafafa' }}>
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                              : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🛍️</div>}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:600, color:'#222', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                            <div style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>{p.category}</div>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                              <span style={{ fontSize:13, fontWeight:700, color:primary }}>{p.price.toLocaleString('vi-VN')}đ</span>
                              {disc && <span style={{ fontSize:10, background:primary, color:'white', padding:'1px 5px', borderRadius:4 }}>-{disc}%</span>}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display:'flex', gap:8, alignItems:'flex-end', marginBottom:12 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:`${primary}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🤖</div>
                <div style={{ background:'#f3f4f6', borderRadius:'16px 16px 16px 4px', padding:'10px 14px', display:'flex', gap:4, alignItems:'center' }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#9ca3af', display:'inline-block', animation:`bounce 1s ${i*0.15}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions — chỉ hiện ở đầu */}
          {messages.length <= 1 && (
            <div style={{ padding:'4px 12px 8px', display:'flex', gap:6, flexWrap:'wrap', flexShrink:0 }}>
              {QUICK_QUESTIONS.map(q => (
                <button key={q} className="quick-btn" onClick={() => send(q)}
                  style={{ fontSize:11, padding:'5px 10px', borderRadius:20, border:`1px solid ${primary}`, background:'white', color:primary, cursor:'pointer', fontWeight:500, transition:'all 0.15s' }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding:'8px 12px', borderTop:'1px solid #f0f0f0', display:'flex', gap:8, flexShrink:0 }}>
            <input
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Nhập câu hỏi..."
              style={{ flex:1, padding:'9px 14px', border:'1.5px solid #e5e7eb', borderRadius:24, fontSize:13, background:'white', transition:'border-color 0.15s' }}
            />
            <button className="send-btn" onClick={() => send()} disabled={loading || !input.trim()}
              style={{ width:38, height:38, borderRadius:'50%', background: loading || !input.trim() ? '#e5e7eb' : primary, border:'none', color:'white', cursor: loading || !input.trim() ? 'default' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, transition:'all 0.15s' }}>
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
    </>
  )
}
