'use client'

import { useEffect, useState } from 'react'

export default function BackToTop({ primary = '#ee4d2d' }: { primary?: string }) {
  const [visible, setVisible] = useState(false)
  const [hover, setHover]     = useState(false)

  useEffect(() => {
    const h = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Lên đầu trang"
      style={{
        position: 'fixed',
        bottom: 130,  // trên nút gọi và sticky bar
        right: 16,
        zIndex: 150,
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: hover ? primary : 'white',
        color: hover ? 'white' : primary,
        border: `2px solid ${primary}`,
        boxShadow: `0 4px 16px ${primary}44`,
        cursor: 'pointer',
        fontSize: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        transform: hover ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
        animation: 'fadeInUp 0.3s ease',
      }}
    >
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      ↑
    </button>
  )
}
