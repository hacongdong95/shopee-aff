'use client'

import Link from 'next/link'

type Category = { id: number; name: string; slug: string }
type Product = {
  id: number; name: string; slug: string; price: number
  oldPrice: number | null; imageUrl: string | null
  affLink: string; isActive: boolean; clicks: number
  description: string | null; categoryId: number
  category: Category
}

export default function ProductCard({ product }: { product: Product }) {
  const discount = product.oldPrice && product.oldPrice > product.price
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null

  return (
    <Link href={`/san-pham/${product.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: 'white', borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
          transition: 'transform 0.18s, box-shadow 0.18s',
          display: 'flex', flexDirection: 'column', height: '100%',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(-4px)'
          el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.14)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = ''
          el.style.boxShadow = '0 1px 6px rgba(0,0,0,0.07)'
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', paddingTop: '100%', background: '#f9f9f9', overflow: 'hidden' }}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, background: 'linear-gradient(135deg, #fff5f3, #ffe8e0)' }}>🛍️</div>
          )}
          {discount && (
            <div style={{ position: 'absolute', top: 0, left: 0, background: '#ee4d2d', color: 'white', fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: '0 0 8px 0' }}>
              -{discount}%
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(238,77,45,0.9)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 4 }}>
            Shopee
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '10px 12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.45, color: '#333', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 38 }}>
            {product.name}
          </div>

          <div style={{ marginTop: 4 }}>
            <div style={{ color: '#ee4d2d', fontWeight: 800, fontSize: 18, lineHeight: 1 }}>
              {product.price.toLocaleString('vi-VN')}<span style={{ fontSize: 12, fontWeight: 600 }}>đ</span>
            </div>
            {product.oldPrice && product.oldPrice > product.price && (
              <div style={{ color: '#aaa', fontSize: 12, textDecoration: 'line-through', marginTop: 2 }}>
                {product.oldPrice.toLocaleString('vi-VN')}đ
              </div>
            )}
          </div>

          {discount && product.oldPrice && (
            <div style={{ background: '#fff5f3', border: '1px solid #ffd5cb', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#ee4d2d', fontWeight: 600 }}>
              Tiết kiệm {(product.oldPrice - product.price).toLocaleString('vi-VN')}đ
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: 8, width: '100%', padding: '9px 0', background: 'linear-gradient(135deg, #ff6b35, #ee4d2d)', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.3px', textAlign: 'center' }}>
            Xem chi tiết →
          </div>
        </div>
      </div>
    </Link>
  )
}
