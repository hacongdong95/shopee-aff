'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface EffectsProps {
  marqueeText?: string
  primary?: string
  // Floating contact buttons
  floatPhone?: string
  floatZalo?: string
  floatFacebook?: string
  floatPhoneShow?: string
  floatZaloShow?: string
  floatFacebookShow?: string
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
      if (btn.closest('header') || btn.closest('nav')) return // skip header/nav

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
        z-index:9999;
      `
      const prev = btn.style.position
      const prev2 = btn.style.overflow
      if (!prev || prev === 'static') btn.style.position = 'relative'
      btn.style.overflow = 'hidden'
      btn.appendChild(ripple)
      ripple.addEventListener('animationend', () => {
        ripple.remove()
        if (!prev || prev === 'static') btn.style.position = prev
        btn.style.overflow = prev2
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
          position:fixed;bottom:80px;right:20px;z-index:999;
          width:42px;height:42px;border-radius:50%;
          background:${color};color:white;border:none;cursor:pointer;
          font-size:18px;display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 16px ${color}66;transition:opacity 0.25s,transform 0.25s
        }
        .back-to-top:hover{transform:translateY(-3px) scale(1.08)}

        /* Float buttons container */
        .float-contact{
          position:fixed;right:16px;bottom:140px;
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
      {!isAdmin && (showPhone || showZalo || showFb) && (
        <div className="float-contact">

          {/* Phone */}
          {showPhone && (
            <a
              href={phoneHref}
              className="float-btn float-btn-phone"
              data-label={floatPhone}
              aria-label="Gọi điện"
              style={{ background: '#22c55e' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.47 11.47 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z"/>
              </svg>
            </a>
          )}

          {/* Zalo */}
          {showZalo && (
            <a
              href={zaloHref}
              target="_blank"
              rel="noopener noreferrer"
              className="float-btn float-btn-zalo"
              data-label="Zalo"
              aria-label="Chat Zalo"
              style={{ background: '#0068ff', padding: 0 }}
            >
              {/* Zalo SVG logo */}
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="26" cy="26" r="26" fill="#0068FF"/>
                <text x="26" y="32" textAnchor="middle" fill="white" fontSize="16" fontWeight="800" fontFamily="Arial">Za</text>
              </svg>
            </a>
          )}

          {/* Facebook */}
          {showFb && (
            <a
              href={fbHref}
              target="_blank"
              rel="noopener noreferrer"
              className="float-btn"
              data-label="Facebook"
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
