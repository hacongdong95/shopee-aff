'use client'

import { useEffect, useState } from 'react'

function getNextFlashSaleEnd() {
  const now = new Date()
  const end = new Date()
  end.setHours(23, 59, 59, 0)
  if (now >= end) end.setDate(end.getDate() + 1)
  return end
}

export default function FlashSaleCountdown({ primary }: { primary: string }) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 })
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
    setMounted(true)
    const tick = () => {
      const diff = getNextFlashSaleEnd().getTime() - Date.now()
      if (diff <= 0) { setTimeLeft({ h: 0, m: 0, s: 0 }); return }
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (!mounted) return null

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div style={{
      background: primary,
      borderBottom: '2px solid rgba(0,0,0,0.08)',
      padding: '0 12px',
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      overflow: 'hidden',
    }}>
      <style>{`
        @media (max-width: 480px) {
          .flash-label { display: none !important; }
          .flash-sep   { display: none !important; }
          .flash-after { display: none !important; }
        }
      `}</style>

      {/* Label FLASH SALE */}
      <div className="flash-label" style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 13 }}>⚡</span>
        <span style={{ color: '#FFD700', fontWeight: 900, fontSize: 12, letterSpacing: '0.5px', fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          FLASH SALE
        </span>
      </div>

      <div className="flash-sep" style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />

      {/* "kết thúc sau" — ẩn mobile */}
      <span className="flash-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, flexShrink: 0, whiteSpace: 'nowrap' }}>
        kết thúc sau:
      </span>

      {/* Countdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        {[pad(timeLeft.h), pad(timeLeft.m), pad(timeLeft.s)].map((val, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{
              background: '#1a1a1a', color: 'white',
              fontWeight: 800, fontSize: 13,
              fontFamily: 'monospace',
              padding: '2px 5px', borderRadius: 4,
              minWidth: 24, textAlign: 'center',
              letterSpacing: '1px', lineHeight: 1.4,
            }}>
              {val}
            </span>
            {i < 2 && <span style={{ color: 'white', fontWeight: 900, fontSize: 13 }}>:</span>}
          </span>
        ))}
      </div>

      {/* ĐANG DIỄN RA */}
      <div className="flash-after" style={{
        background: '#FFD700', color: '#c0392b',
        fontSize: 10, fontWeight: 800,
        padding: '2px 7px', borderRadius: 3,
        letterSpacing: '0.3px', flexShrink: 0,
        whiteSpace: 'nowrap',
      }}>
        ĐANG DIỄN RA
      </div>
    </div>
  )
}
