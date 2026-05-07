'use client'

import { useRef } from 'react'

export default function BuyButton({
  productId,
  affLink,
  variant = 'primary',
  label = 'Mua Ngay',
}: {
  productId: number
  affLink: string
  variant?: 'primary' | 'outline'
  label?: string
}) {
  const linkRef = useRef<HTMLAnchorElement>(null)

  const handleBuy = async () => {
    // Đếm click — fire and forget, không chờ
    fetch(`/api/products/${productId}/click`, { method: 'POST' }).catch(() => {})
    // Click vào <a> tag thật → hoạt động trên cả mobile
    linkRef.current?.click()
  }

  const handleScrollToDesc = () => {
    document.getElementById('product-description')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (variant === 'outline') {
    return (
      <button
        onClick={handleScrollToDesc}
        style={{
          flex: 1, padding: '13px 0',
          background: '#fff0ee', color: '#ee4d2d',
          border: '1px solid #ee4d2d', borderRadius: 2,
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#ffe4df'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#fff0ee'}
      >
        📋 {label}
      </button>
    )
  }

  return (
    <>
      {/* Anchor ẩn — mobile cần <a> tag thật để mở link */}
      <a
        ref={linkRef}
        href={affLink}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      <button
        onClick={handleBuy}
        style={{
          flex: 1, padding: '13px 0',
          background: '#ee4d2d', color: 'white',
          border: 'none', borderRadius: 2,
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#d73211'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#ee4d2d'}
      >
        ⚡ {label}
      </button>
    </>
  )
}
