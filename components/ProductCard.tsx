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
    <Link href={`/san-pham/${product.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div className="product-card" style={{
        background: 'white', borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
        display: 'flex', flexDirection: 'column', height: '100%',
        border: '1px solid rgba(0,0,0,0.06)',
      }}>

        {/* Image */}
        <div style={{ position: 'relative', paddingTop: '100%', background: '#f8f8f8', overflow: 'hidden' }}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 48, background: 'linear-gradient(135deg, #fff5f3, #ffe8e0)',
            }}>🛍️</div>
          )}

          {/* Discount badge */}
          {discount && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: 'var(--primary)', color: 'white',
              fontSize: 11, fontWeight: 800, padding: '4px 9px',
              borderRadius: 20, letterSpacing: '0.3px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              animation: 'badgePop 0.4s cubic-bezier(.22,1,.36,1) both',
            }}>
              -{discount}%
            </div>
          )}

          {/* Shopee badge */}
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            background: 'white', fontSize: 10, fontWeight: 700,
            padding: '3px 8px', borderRadius: 20,
            color: 'var(--primary)',
            border: '1.5px solid var(--primary)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}>
            Shopee
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '12px 13px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>

          {/* Category */}
          <div style={{
            fontSize: 10, fontWeight: 700, color: 'var(--primary)',
            background: 'var(--primary-light, rgba(238,77,45,0.08))',
            display: 'inline-block', padding: '2px 9px', borderRadius: 20,
            width: 'fit-content', letterSpacing: '0.4px', textTransform: 'uppercase',
          }}>
            {product.category.name}
          </div>

          {/* Name */}
          <div style={{
            fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: '#1a1a1a',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 39,
          }}>
            {product.name}
          </div>

          {/* Price */}
          <div>
            <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 19, lineHeight: 1 }}>
              {product.price.toLocaleString('vi-VN')}
              <span style={{ fontSize: 12, fontWeight: 600 }}>đ</span>
            </div>
            {product.oldPrice && product.oldPrice > product.price && (
              <div style={{ color: '#bbb', fontSize: 12, textDecoration: 'line-through', marginTop: 2 }}>
                {product.oldPrice.toLocaleString('vi-VN')}đ
              </div>
            )}
          </div>

          {/* Savings */}
          {discount && product.oldPrice && (
            <div style={{
              background: 'var(--primary-light, rgba(238,77,45,0.07))',
              border: '1px solid var(--primary-mid, rgba(238,77,45,0.18))',
              borderRadius: 8, padding: '4px 9px',
              fontSize: 11, color: 'var(--primary)', fontWeight: 600,
            }}>
              💰 Tiết kiệm {(product.oldPrice - product.price).toLocaleString('vi-VN')}đ
            </div>
          )}

          {/* CTA */}
          <div className="cta-btn" style={{
            marginTop: 'auto', paddingTop: 8,
            padding: '10px 0',
            background: 'var(--primary)',
            color: 'white', borderRadius: 9,
            fontSize: 13, fontWeight: 700,
            textAlign: 'center', letterSpacing: '0.3px',
            boxShadow: '0 2px 8px var(--primary-mid, rgba(238,77,45,0.3))',
          }}>
            Xem chi tiết →
          </div>
        </div>
      </div>
    </Link>
  )
}
