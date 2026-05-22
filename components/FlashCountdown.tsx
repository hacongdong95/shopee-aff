'use client'

import { useEffect, useState } from 'react'

function getNextFlashSaleEnd() {
  const now = new Date()
  // Random 1-2 tiếng từ lúc load trang
  const randomMinutes = Math.floor(Math.random() * 60) + 60 // 60-120 phút
  const end = new Date(now.getTime() + randomMinutes * 60 * 1000)
  return end
}

export default function FlashCountdown({ productId }: { productId: number }) {
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        background: '#1a1a1a', color: 'white',
        fontWeight: 800, fontSize: 13,
        fontFamily: 'monospace',
        padding: '2px 6px', borderRadius: 3,
        minWidth: 26, textAlign: 'center',
        letterSpacing: '1px', lineHeight: 1.4,
      }}>
        {pad(timeLeft.h)}
      </span>
      <span style={{ color: '#1a1a1a', fontWeight: 900, fontSize: 13 }}>:</span>
      <span style={{
        background: '#1a1a1a', color: 'white',
        fontWeight: 800, fontSize: 13,
        fontFamily: 'monospace',
        padding: '2px 6px', borderRadius: 3,
        minWidth: 26, textAlign: 'center',
        letterSpacing: '1px', lineHeight: 1.4,
      }}>
        {pad(timeLeft.m)}
      </span>
      <span style={{ color: '#1a1a1a', fontWeight: 900, fontSize: 13 }}>:</span>
      <span style={{
        background: '#1a1a1a', color: 'white',
        fontWeight: 800, fontSize: 13,
        fontFamily: 'monospace',
        padding: '2px 6px', borderRadius: 3,
        minWidth: 26, textAlign: 'center',
        letterSpacing: '1px', lineHeight: 1.4,
      }}>
        {pad(timeLeft.s)}
      </span>
    </div>
  )
}
