'use client'

import Link from 'next/link'

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

function getBadge(product: Product): { label: string; color: string; bg: string } | null {
  const discount = product.oldPrice && product.oldPrice > product.price
    ? Math.round((1 - product.price / product.oldPrice) * 100) : 0
  if (discount >= 50) return { label: '💥 SALE SỐC', color: 'white', bg: '#c0392b' }
  if (discount >= 30) return { label: '🔥 Hot Deal', color: 'white', bg: '#e67e22' }
  if (product.clicks > 500) return { label: '⭐ Bán Chạy', color: 'white', bg: '#8e44ad' }
  if (product.clicks > 200) return { label: '👍 Phổ Biến', color: 'white', bg: '#2980b9' }
  // Sản phẩm mới (7 ngày gần đây)
  if (product.createdAt) {
    const daysDiff = (Date.now() - new Date(product.createdAt as string | Date).getTime()) / 86400000
    if (daysDiff < 7) return { label: '🆕 Mới Về', color: 'white', bg: '#27ae60' }
  }
  return null
}

function getViewers(id: number): number {
  // Fake số người đang xem — seeded theo id để ổn định
  return Math.floor(seededRandom(id * 17) * 18 + 3)
}

function getStockPercent(id: number): number {
  return Math.floor(seededRandom(id * 23) * 40 + 15) // 15-55%
}

export default function ProductCard({ product }: { product: Product }) {
  const discount = product.oldPrice && product.oldPrice > product.price
    ? Math.round((1 - product.price / product.oldPrice) * 100) : null
  const badge = getBadge(product)
  const viewers = getViewers(product.id)
  const stockPct = getStockPercent(product.id)
  const images = product.imageUrl ? product.imageUrl.split('\n').map(u => u.trim()).filter(Boolean) : []
  const thumb = images[0] || null

  return (
    <Link href={`/san-pham/${product.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div className="product-card" style={{
        background: 'white', borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
        display: 'flex', flexDirection: 'column', height: '100%',
        border: '1px solid rgba(0,0,0,0.06)',
        transition: 'transform 0.18s, box-shadow 0.18s',
      }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(-4px)'
          el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.13)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = ''
          el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.07)'
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', paddingTop: '100%', background: '#f8f8f8', overflow: 'hidden' }}>
          {thumb ? (
            <img src={thumb} alt={product.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
              onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)'}
              onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = ''}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, background: 'linear-gradient(135deg, #fff5f3, #ffe8e0)' }}>🛍️</div>
          )}

          {/* Discount badge */}
          {discount && (
            <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--primary)', color: 'white', fontSize: 11, fontWeight: 800, padding: '4px 9px', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              -{discount}%
            </div>
          )}

          {/* Special badge (Hot/New/Sale) */}
          {badge && (
            <div style={{ position: 'absolute', top: discount ? 38 : 10, left: 10, background: badge.bg, color: badge.color, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20, boxShadow: '0 2px 6px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
              {badge.label}
            </div>
          )}

          {/* Viewers FOMO */}
          <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(4px)', color: 'white', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ecc71', display: 'inline-block', boxShadow: '0 0 0 2px rgba(46,204,113,0.3)', animation: 'pulse 1.5s infinite' }} />
            {viewers} đang xem
          </div>

          {/* Shopee badge */}
          <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, color: 'var(--primary)', border: '1.5px solid var(--primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            Shopee
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '12px 13px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>

          {/* Category */}
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', background: 'rgba(238,77,45,0.08)', display: 'inline-block', padding: '2px 9px', borderRadius: 20, width: 'fit-content', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            {product.category.name}
          </div>

          {/* Name */}
          <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: '#1a1a1a', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 39 }}>
            {product.name}
          </div>

          {/* Price */}
          <div>
            <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 19, lineHeight: 1 }}>
              {product.price.toLocaleString('vi-VN')}<span style={{ fontSize: 12, fontWeight: 600 }}>đ</span>
            </div>
            {product.oldPrice && product.oldPrice > product.price && (
              <div style={{ color: '#bbb', fontSize: 12, textDecoration: 'line-through', marginTop: 2 }}>
                {product.oldPrice.toLocaleString('vi-VN')}đ
              </div>
            )}
          </div>

          {/* Savings */}
          {discount && product.oldPrice && (
            <div style={{ background: 'rgba(238,77,45,0.07)', border: '1px solid rgba(238,77,45,0.18)', borderRadius: 8, padding: '4px 9px', fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>
              💰 Tiết kiệm {(product.oldPrice - product.price).toLocaleString('vi-VN')}đ
            </div>
          )}

          {/* Stock urgency bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginBottom: 4 }}>
              <span>🏃 Đã bán {100 - stockPct}%</span>
              <span style={{ color: stockPct < 25 ? '#e74c3c' : '#e67e22', fontWeight: 700 }}>
                {stockPct < 25 ? '🔴 Sắp hết!' : stockPct < 40 ? '🟠 Còn ít' : '🟢 Còn hàng'}
              </span>
            </div>
            <div style={{ height: 4, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${100 - stockPct}%`, background: stockPct < 25 ? 'linear-gradient(90deg,#e74c3c,#c0392b)' : 'linear-gradient(90deg,#f39c12,#e67e22)', borderRadius: 4, transition: 'width 0.6s ease' }} />
            </div>
          </div>

          {/* CTA */}
          <div style={{ marginTop: 'auto', padding: '10px 0', background: 'var(--primary)', color: 'white', borderRadius: 9, fontSize: 13, fontWeight: 700, textAlign: 'center', letterSpacing: '0.3px', boxShadow: '0 2px 8px rgba(238,77,45,0.3)' }}>
            Xem chi tiết →
          </div>
        </div>
      </div>
    </Link>
  )
}
