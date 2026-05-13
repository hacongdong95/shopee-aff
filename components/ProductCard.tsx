'use client'

import Link from 'next/link'
import { useState } from 'react'

type Category = { id: number; name: string; slug: string }
type Product = {
  id: number; name: string; slug: string; price: number
  oldPrice: number | null; imageUrl: string | null
  affLink: string; isActive: boolean; clicks: number
  description: string | null; categoryId: number
  category: Category; createdAt?: string | Date
}

function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x)
}

function getSoldCount(id: number): string {
  const n = Math.floor(seededRandom(id * 3) * 9800 + 200)
  if (n >= 10000) return '10k+'
  if (n >= 1000)  return `${Math.floor(n / 100) / 10}k`
  return String(n)
}

function getRating(id: number): string {
  return (seededRandom(id * 13) * 0.6 + 4.3).toFixed(1)
}

function getIsNew(product: Product): boolean {
  if (!product.createdAt) return false
  return (Date.now() - new Date(product.createdAt as string | Date).getTime()) / 86400000 < 7
}

export default function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false)
  const [imgErr, setImgErr] = useState(false)

  const discount  = product.oldPrice && product.oldPrice > product.price
    ? Math.round((1 - product.price / product.oldPrice) * 100) : null
  const images    = product.imageUrl ? product.imageUrl.split('\n').map(u => u.trim()).filter(Boolean) : []
  const thumb     = (!imgErr && images[0]) || null
  const sold      = getSoldCount(product.id)
  const rating    = getRating(product.id)
  const isNew     = getIsNew(product)
  const isMall    = product.clicks > 300  // giả lập Mall badge
  const isYeuthich = seededRandom(product.id * 7) > 0.5

  // Label badge trên ảnh (góc trái trên)
  const topBadge = (() => {
    if (isMall)     return { text: 'Mall',   bg: '#d0011b', icon: '🏆' }
    if (isYeuthich) return { text: 'Yêu thích', bg: '#ee4d2d', icon: '❤️' }
    if (isNew)      return { text: 'Mới',    bg: '#26aa99', icon: '' }
    return null
  })()

  return (
    <Link href={`/san-pham/${product.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        style={{
          background: 'white',
          borderRadius: 4,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          border: '1px solid #f0f0f0',
          transition: 'box-shadow 0.18s',
          cursor: 'pointer',
          position: 'relative',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
      >
        {/* ── Ảnh ── */}
        <div style={{ position: 'relative', paddingTop: '100%', background: '#f5f5f5', overflow: 'hidden', flexShrink: 0 }}>
          {thumb ? (
            <img
              src={thumb}
              alt={product.name}
              onError={() => setImgErr(true)}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s ease' }}
              onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
              onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, color: '#ddd' }}>🛍️</div>
          )}

          {/* Badge Yêu thích / Mall góc trái trên */}
          {topBadge && (
            <div style={{
              position: 'absolute', top: 0, left: 0,
              background: topBadge.bg, color: 'white',
              fontSize: 10, fontWeight: 700,
              padding: '3px 8px 3px 6px',
              borderRadius: '0 0 8px 0',
              display: 'flex', alignItems: 'center', gap: 3,
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}>
              {topBadge.icon && <span style={{ fontSize: 11 }}>{topBadge.icon}</span>}
              {topBadge.text}
            </div>
          )}

          {/* Badge % giảm góc phải trên */}
          {discount && discount >= 5 && (
            <div style={{
              position: 'absolute', top: 0, right: 0,
              background: '#d0011b',
              color: 'white',
              fontSize: 12, fontWeight: 800,
              padding: '4px 7px',
              borderRadius: '0 0 0 8px',
              lineHeight: 1.2,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.9 }}>GIẢM</div>
              <div>{discount}%</div>
            </div>
          )}

          {/* Nút yêu thích góc phải dưới */}
          <div
            onClick={e => { e.preventDefault(); e.stopPropagation(); setLiked(l => !l) }}
            style={{
              position: 'absolute', bottom: 8, right: 8,
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 15,
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s',
              zIndex: 2,
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.2)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'}
          >
            {liked ? '❤️' : '🤍'}
          </div>

          {/* Voucher strip dưới ảnh — giống Shopee */}
          {discount && discount >= 10 && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(90deg, #ff6633, #ee4d2d)',
              color: 'white', fontSize: 10, fontWeight: 700,
              padding: '3px 8px',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 3, padding: '1px 5px', fontSize: 9, fontWeight: 800 }}>VOUCHER</span>
              <span>Giảm thêm tới {Math.min(discount, 30)}%</span>
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div style={{ padding: '8px 10px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Tên sản phẩm — 2 dòng như Shopee */}
          <div style={{
            fontSize: 13, fontWeight: 400, lineHeight: 1.45, color: '#333',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', minHeight: 38, marginBottom: 6,
          }}>
            {product.name}
          </div>

          {/* Giá */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ color: '#ee4d2d', fontWeight: 700, fontSize: 17, lineHeight: 1 }}>
              {product.price.toLocaleString('vi-VN')}
              <span style={{ fontSize: 11, fontWeight: 600 }}>₫</span>
            </span>
            {product.oldPrice && product.oldPrice > product.price && (
              <span style={{ color: '#999', fontSize: 12, textDecoration: 'line-through' }}>
                {product.oldPrice.toLocaleString('vi-VN')}₫
              </span>
            )}
          </div>

          {/* Sao + lượt bán — GIỐNG SHOPEE */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            {/* Sao */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ display: 'flex', gap: 1 }}>
                {[1,2,3,4,5].map(i => {
                  const r = Number(rating)
                  const full = i <= Math.floor(r)
                  const half = !full && i === Math.ceil(r)
                  return (
                    <span key={i} style={{ fontSize: 11, color: full || half ? '#f5a623' : '#e0e0e0', lineHeight: 1 }}>
                      {full ? '★' : half ? '⯨' : '★'}
                    </span>
                  )
                })}
              </div>
              <span style={{ fontSize: 11, color: '#767676' }}>{rating}</span>
            </div>
            {/* Lượt bán */}
            <span style={{ fontSize: 11, color: '#767676' }}>
              Đã bán <span style={{ fontWeight: 600, color: '#555' }}>{sold}</span>
            </span>
          </div>

          {/* Location + shipping — giống Shopee */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 10, color: '#999', display: 'flex', alignItems: 'center', gap: 3 }}>
              📍 <span>Hà Nội</span>
            </span>
            {/* Free ship badge */}
            {seededRandom(product.id * 5) > 0.4 && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#26aa99',
                border: '1px solid #26aa99', borderRadius: 2,
                padding: '1px 4px', lineHeight: 1.4,
              }}>
                FREESHIP
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
