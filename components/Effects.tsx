'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function Effects({ marqueeText, primary }: { marqueeText?: string; primary?: string }) {
  const pathname = usePathname()
  const [showTop, setShowTop] = useState(false)
  const color = primary || '#ee4d2d'

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
        .back-to-top{position:fixed;bottom:80px;right:20px;z-index:999;width:42px;height:42px;border-radius:50%;background:${color};color:white;border:none;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px ${color}66;transition:opacity 0.25s,transform 0.25s}
        .back-to-top:hover{transform:translateY(-3px) scale(1.08)}
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
            {/* Nhân đôi để loop liền mạch */}
            {[0, 1].map(i => (
              <span key={i} style={{ display: 'inline-block', padding: '0 60px', fontSize: 12, fontWeight: 700, color: 'white', letterSpacing: '0.3px' }}>
                {marqueeText}
              </span>
            ))}
          </div>
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
