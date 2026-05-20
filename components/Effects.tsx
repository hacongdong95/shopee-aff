'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface EffectsProps {
  marqueeText?: string
  primary?: string
  floatPhone?: string
  floatZalo?: string
  floatFacebook?: string
  floatPhoneShow?: string
  floatZaloShow?: string
  floatFacebookShow?: string
  // Labels/tooltips
  floatPhoneLabel?: string
  floatZaloLabel?: string
  floatFacebookLabel?: string
  // AI chat button
  floatAiShow?: string
  floatAiLabel?: string
  floatAiColor?: string
}


// ── AI Chat Widget ─────────────────────────────────────────────────────────
function AiChatWidget({ aiColor, aiLabel }: { aiColor: string; aiLabel: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay? 😊' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    const updated = [...messages, { role: 'user' as const, text: userMsg }]
    setMessages(updated)
    setLoading(true)
    try {
      const history = updated.slice(1, -1).map(m => ({ role: m.role, content: m.text }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply || 'Xin lỗi, thử lại nhé!' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Có lỗi. Vui lòng thử lại!' }])
    }
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(o => !o)} style={{
        position: 'fixed', right: 16, bottom: 130, zIndex: 1001,
        background: aiColor, color: 'white', border: 'none',
        borderRadius: 28, height: 48, padding: '0 16px 0 12px',
        display: 'flex', alignItems: 'center', gap: 8,
        cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        fontFamily: 'inherit', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        {aiLabel}
      </button>

      {open && (
        <div style={{
          position: 'fixed', right: 16, bottom: 190, zIndex: 1002,
          width: 320, maxWidth: 'calc(100vw - 32px)',
          background: 'white', borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ background: aiColor, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>💬 {aiLabel}</span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ height: 260, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '8px 12px',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user' ? aiColor : '#f3f4f6',
                  color: m.role === 'user' ? 'white' : '#333',
                  fontSize: 13, lineHeight: 1.5,
                }}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '8px 12px', borderRadius: '16px 16px 16px 4px', background: '#f3f4f6', fontSize: 13, color: '#999' }}>Đang trả lời...</div>
              </div>
            )}
          </div>
          <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Nhập câu hỏi..."
              style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 20, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            />
            <button onClick={send} disabled={loading || !input.trim()}
              style={{ background: aiColor, color: 'white', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: (!input.trim() || loading) ? 0.5 : 1 }}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default function Effects({
  marqueeText,
  primary,
  floatPhone,
  floatZalo,
  floatFacebook,
  floatPhoneShow,
  floatZaloShow,
  floatFacebookShow,
  floatPhoneLabel,
  floatZaloLabel,
  floatFacebookLabel,
  floatAiShow,
  floatAiLabel,
  floatAiColor,
}: EffectsProps) {
  const pathname = usePathname()
  const [showTop, setShowTop] = useState(false)
  const color = primary || '#ee4d2d'

  // Tính link Zalo: nếu là số điện thoại thì tạo link zalo.me
  const zaloHref = floatZalo
    ? /^[\d\s+()-]{9,15}$/.test(floatZalo.trim())
      ? `https://zalo.me/${floatZalo.trim().replace(/\D/g, '')}`
      : floatZalo
    : ''

  // Link Facebook
  const fbHref = floatFacebook || ''

  // Link Phone
  const phoneHref = floatPhone ? `tel:${floatPhone.replace(/\s/g, '')}` : ''

  const showPhone = floatPhoneShow !== 'false' && !!floatPhone?.trim()
  const showZalo  = floatZaloShow  !== 'false' && !!floatZalo?.trim()
  const showFb    = floatFacebookShow !== 'false' && !!floatFacebook?.trim()
  const showAi    = floatAiShow !== 'false'
  const aiLabel   = floatAiLabel || 'Bạn cần tư vấn?'
  const aiColor   = floatAiColor || '#ee4d2d'

  // Back to top
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Ripple effect trên tất cả button/a
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const btn = target.closest('button, a, [data-ripple]') as HTMLElement | null
      if (!btn) return
      if (btn.closest('header') || btn.closest('nav')) return
      if (btn.closest('.float-contact')) return
      // Skip tất cả nút có onClick handler quan trọng
      if (btn.tagName === 'BUTTON' && btn.getAttribute('data-ripple') === null) {
        // Chỉ apply ripple nếu button không có onclick critical
        const hasImportantClick = btn.closest('.pd-cta, .share-section, [data-no-ripple]')
        if (hasImportantClick) return
      }
      const href = (btn as HTMLAnchorElement).href || ''
      if (href.includes('shopee') || href.includes('shope.ee')) return
      // Skip ripple trên các button có data-no-ripple hoặc nằm trong .pd-actions
      if (btn.closest('.pd-actions, .share-dropdown, [data-no-ripple]')) return

      const rect = btn.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 2
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2

      const ripple = document.createElement('span')
      ripple.style.cssText = `
        position:absolute;width:${size}px;height:${size}px;
        left:${x}px;top:${y}px;
        border-radius:50%;background:rgba(255,255,255,0.25);
        transform:scale(0);pointer-events:none;
        animation:ripple-anim 0.55s ease-out forwards;
        z-index:0;
      `
      const prevPos = btn.style.position
      if (!prevPos || prevPos === 'static') btn.style.position = 'relative'
      // KHÔNG set overflow:hidden — để window.open hoạt động bình thường
      btn.appendChild(ripple)
      ripple.addEventListener('animationend', () => {
        ripple.remove()
        if (!prevPos || prevPos === 'static') btn.style.position = prevPos
      })
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const isAdmin = pathname.startsWith('/admin')

  return (
    <>
      <style>{`
        @keyframes ripple-anim{to{transform:scale(1);opacity:0}}
        @keyframes marquee-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes float-in{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}
        @keyframes phone-ring{0%,100%{transform:rotate(0)}10%{transform:rotate(-15deg)}20%{transform:rotate(15deg)}30%{transform:rotate(-10deg)}40%{transform:rotate(10deg)}50%{transform:rotate(0)}}

        .back-to-top{
          position:fixed;bottom:16px;right:16px;z-index:999;
          width:42px;height:42px;border-radius:50%;
          background:${color};color:white;border:none;cursor:pointer;
          font-size:18px;display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 16px ${color}66;transition:opacity 0.25s,box-shadow 0.25s
        }
        .back-to-top:hover{box-shadow:0 6px 20px ${color}99;opacity:0.9}

        /* Float buttons container */
        .float-contact{
          position:fixed;right:16px;bottom:70px;
          z-index:1000;display:flex;flex-direction:column;gap:10px;
          animation:float-in 0.4s ease both;
        }
        .float-btn{
          width:52px;height:52px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          text-decoration:none;cursor:pointer;
          box-shadow:0 4px 16px rgba(0,0,0,0.22);
          transition:transform 0.2s,box-shadow 0.2s;
          position:relative;overflow:visible;
          flex-shrink:0;
        }
        .float-btn:hover{transform:scale(1.12) translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.28)}
        .float-btn img{width:30px;height:30px;object-fit:contain;border-radius:50%}

        /* Tooltip label bên trái */
        .float-btn::before{
          content:attr(data-label);
          position:absolute;right:62px;top:50%;transform:translateY(-50%);
          background:rgba(0,0,0,0.75);color:white;
          padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;
          white-space:nowrap;pointer-events:none;opacity:0;
          transition:opacity 0.2s;font-family:inherit;
        }
        .float-btn:hover::before{opacity:1}

        /* Ripple pulse cho phone */
        .float-btn-phone::after{
          content:'';position:absolute;inset:-6px;border-radius:50%;
          border:2px solid rgba(34,197,94,0.6);
          animation:pulse-ring 2s ease-out infinite;
        }
        @keyframes pulse-ring{
          0%{transform:scale(1);opacity:0.8}
          100%{transform:scale(1.5);opacity:0}
        }
        .float-btn-phone svg{animation:phone-ring 3s ease 2s infinite}

        /* Ripple pulse cho zalo */
        .float-btn-zalo::after{
          content:'';position:absolute;inset:-5px;border-radius:50%;
          border:2px solid rgba(0,104,255,0.5);
          animation:pulse-ring 2.5s ease-out 0.5s infinite;
        }
        @keyframes labelPulse{
          0%,100%{opacity:1;transform:translateY(-50%) scale(1)}
          50%{opacity:0.85;transform:translateY(-50%) scale(1.03)}
        }
      `}</style>

      {/* Marquee — chỉ hiện ngoài admin và khi có text */}
      {!isAdmin && marqueeText && (
        <div style={{
          background: color,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          height: 32,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          zIndex: 101,
        }}>
          <div style={{
            display: 'inline-block',
            animation: 'marquee-scroll 22s linear infinite',
            willChange: 'transform',
          }}>
            {[0, 1].map(i => (
              <span key={i} style={{ display: 'inline-block', padding: '0 60px', fontSize: 12, fontWeight: 700, color: 'white', letterSpacing: '0.3px' }}>
                {marqueeText}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Floating Contact Buttons ── */}
      {!isAdmin && (showPhone || showZalo || showFb || showAi) && (
        <div className="float-contact">

          {/* Zalo — trên */}
          {showZalo && (
            <a href={zaloHref} target="_blank" rel="noopener noreferrer"
              className="float-btn float-btn-zalo"
              data-label={floatZaloLabel || 'Chat Zalo'}
              aria-label="Chat Zalo"
              style={{ background: '#0068ff', padding: 0 }}
            >
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="26" fill="#0068FF"/>
                <text x="26" y="32" textAnchor="middle" fill="white" fontSize="16" fontWeight="800" fontFamily="Arial">Za</text>
              </svg>
            </a>
          )}
          {/* Phone */}
          {showPhone && (
            <a href={phoneHref}
              className="float-btn float-btn-phone"
              data-label={floatPhoneLabel || floatPhone}
              aria-label="Gọi điện"
              style={{ background: '#22c55e' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.47 11.47 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z"/>
              </svg>
            </a>
          )}
          {/* Facebook */}
          {showFb && (
            <a href={fbHref} target="_blank" rel="noopener noreferrer"
              className="float-btn"
              data-label={floatFacebookLabel || 'Facebook'}
              aria-label="Facebook"
              style={{ background: '#1877f2' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
            </a>
          )}
        </div>
      )}
      {/* AI Chat Widget — riêng biệt */}
      {!isAdmin && showAi && <AiChatWidget aiColor={aiColor} aiLabel={aiLabel} />}

      {/* Back to top */}
      {showTop && (
        <button
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Lên đầu trang"
        >
          ↑
        </button>
      )}
    </>
  )
}
