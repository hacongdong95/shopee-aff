'use client'

import { useEffect, useState } from 'react'

function getNextFlashSaleEnd() {
  // Flash sale kết thúc lúc 23:59 mỗi ngày
  const now = new Date()
  const end = new Date()
  end.setHours(23, 59, 59, 0)
  if (now >= end) end.setDate(end.getDate() + 1)
  return end
}

export default function FlashSaleCountdown({ primary }: { primary: string }) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 })
  const [mounted, setMounted] = useState(false)

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
      background: `linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
      padding: '10px 20px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <span style={{ color: '#FFD700', fontWeight: 800, fontSize: 14, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Flash Sale</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>kết thúc sau:</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[pad(timeLeft.h), pad(timeLeft.m), pad(timeLeft.s)].map((val, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                background: primary, color: 'white', fontWeight: 800, fontSize: 16,
                padding: '4px 10px', borderRadius: 8, fontFamily: 'monospace',
                minWidth: 36, textAlign: 'center',
                boxShadow: `0 2px 8px ${primary}66`,
              }}>{val}</span>
              {i < 2 && <span style={{ color: '#FFD700', fontWeight: 800, fontSize: 18 }}>:</span>}
            </span>
          ))}
        </div>
        <span style={{
          background: '#FFD700', color: '#1a1a1a', fontSize: 11, fontWeight: 800,
          padding: '3px 10px', borderRadius: 20, letterSpacing: '0.5px',
          animation: 'pulse 1.5s infinite',
        }}>ĐANG DIỄN RA</span>
      </div>
    </div>
  )
}
