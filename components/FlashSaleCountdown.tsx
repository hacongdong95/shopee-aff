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
    <div style={{ background: primary, borderBottom: `2px solid rgba(0,0,0,0.08)` }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 20px',
        height: 44,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        {/* Icon + FLASH SALE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 16 }}>⚡</span>
          <span style={{
            color: '#FFD700',
            fontWeight: 900,
            fontSize: 15,
            letterSpacing: '1px',
            fontFamily: 'Nunito, sans-serif',
            textTransform: 'uppercase',
            textShadow: '0 1px 2px rgba(0,0,0,0.15)',
          }}>
            FLASH SALE
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />

        {/* "kết thúc sau:" */}
        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, flexShrink: 0 }}>
          kết thúc sau:
        </span>

        {/* Countdown blocks — kiểu Shopee */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {[pad(timeLeft.h), pad(timeLeft.m), pad(timeLeft.s)].map((val, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                background: '#1a1a1a',
                color: 'white',
                fontWeight: 800,
                fontSize: 15,
                fontFamily: 'monospace',
                padding: '3px 8px',
                borderRadius: 4,
                minWidth: 30,
                textAlign: 'center',
                letterSpacing: '1px',
                lineHeight: 1.4,
              }}>
                {val}
              </span>
              {i < 2 && (
                <span style={{ color: 'white', fontWeight: 900, fontSize: 16, lineHeight: 1 }}>:</span>
              )}
            </span>
          ))}
        </div>

        {/* ĐANG DIỄN RA badge */}
        <div style={{
          background: '#FFD700',
          color: '#c0392b',
          fontSize: 11,
          fontWeight: 800,
          padding: '3px 10px',
          borderRadius: 3,
          letterSpacing: '0.5px',
          flexShrink: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }}>
          ĐANG DIỄN RA
        </div>
      </div>
    </div>
  )
}
