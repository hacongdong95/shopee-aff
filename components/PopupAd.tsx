'use client'

import { useEffect, useState } from 'react'

type Props = {
  imageUrl: string
  affLink: string
  title?: string
  subtitle?: string
  btnText?: string
  primary?: string
  delaySeconds?: number
}

export default function PopupAd({
  imageUrl, affLink, title, subtitle,
  btnText = 'Mua Ngay – Giá Tốt Nhất!',
  primary = '#ee4d2d',
  delaySeconds = 2,
}: Props) {
  const [show, setShow] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    // Kiểm tra đã show trong session này chưa
    const shown = sessionStorage.getItem('popup_shown')
    if (shown) return
    const t = setTimeout(() => setShow(true), delaySeconds * 1000)
    return () => clearTimeout(t)
  }, [delaySeconds])

  const close = () => {
    setClosing(true)
    setTimeout(() => { setShow(false); setClosing(false) }, 280)
    sessionStorage.setItem('popup_shown', '1')
  }

  const handleClick = () => {
    window.open(affLink, '_blank')
    close()
  }

  if (!show) return null

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) close() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        animation: closing ? 'fadeOut 0.28s ease forwards' : 'fadeIn 0.28s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeOut { from { opacity:1 } to { opacity:0 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(32px) scale(0.97) } to { opacity:1; transform:none } }
        @keyframes pulse2  { 0%,100% { transform:scale(1) } 50% { transform:scale(1.04) } }
      `}</style>

      <div style={{
        background: 'white', borderRadius: 20, overflow: 'hidden',
        maxWidth: 420, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        animation: closing ? '' : 'slideUp 0.32s cubic-bezier(.22,1,.36,1)',
        position: 'relative',
      }}>
        {/* Close button */}
        <button onClick={close} style={{
          position: 'absolute', top: 12, right: 12, zIndex: 10,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          border: 'none', borderRadius: '50%', width: 32, height: 32,
          color: 'white', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, lineHeight: 1,
        }}>×</button>

        {/* Badge */}
        <div style={{
          position: 'absolute', top: 14, left: 14, zIndex: 10,
          background: '#FFD700', color: '#1a1a1a',
          fontSize: 11, fontWeight: 800, padding: '4px 12px',
          borderRadius: 20, letterSpacing: '0.5px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          animation: 'pulse2 1.8s infinite',
        }}>⚡ DEAL ĐẶC BIỆT</div>

        {/* Image */}
        <div style={{ position: 'relative', width: '100%', paddingTop: '65%', background: '#f5f5f5', cursor: 'pointer' }} onClick={handleClick}>
          <img src={imageUrl} alt={title || 'Deal đặc biệt'}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Gradient overlay bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(transparent, rgba(0,0,0,0.5))' }} />
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px 24px' }}>
          {title && (
            <div style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', marginBottom: 6, lineHeight: 1.35 }}>
              {title}
            </div>
          )}
          {subtitle && (
            <div style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.5 }}>
              {subtitle}
            </div>
          )}

          {/* CTA Button */}
          <button onClick={handleClick} style={{
            width: '100%', padding: '14px 0',
            background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
            color: 'white', border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 800, cursor: 'pointer',
            boxShadow: `0 4px 20px ${primary}55`,
            letterSpacing: '0.3px', transition: 'transform 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = ''}
          >
            🛒 {btnText}
          </button>

          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: '#aaa' }}>
            Bạn sẽ được chuyển đến Shopee để mua hàng an toàn
          </div>
        </div>
      </div>
    </div>
  )
}
