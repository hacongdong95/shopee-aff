'use client'

import { useState } from 'react'
import ProductCard from './ProductCard'
import ScrollReveal from './ScrollReveal'

type Category = { id: number; name: string; slug: string }
type Product = {
  id: number; name: string; slug: string; price: number
  oldPrice: number | null; imageUrl: string | null
  affLink: string; isActive: boolean; clicks: number
  description: string | null; categoryId: number
  category: Category; createdAt?: string | Date
}

const PAGE_SIZE = 9

export default function ProductGrid({ products, primary }: { products: Product[]; primary: string }) {
  const [visible, setVisible] = useState(PAGE_SIZE)

  const shown = products.slice(0, visible)
  const hasMore = visible < products.length
  const remaining = products.length - visible

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        {shown.map((p, i) => (
          <ScrollReveal key={p.id} delay={Math.min((i % PAGE_SIZE) * 60, 300)}>
            <ProductCard product={p} />
          </ScrollReveal>
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            onClick={() => setVisible(v => v + PAGE_SIZE)}
            style={{
              padding: '12px 36px', background: 'white',
              border: `2px solid ${primary}`, borderRadius: 24,
              color: primary, fontWeight: 700, fontSize: 14,
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.background = primary
              el.style.color = 'white'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.background = 'white'
              el.style.color = primary
            }}
          >
            Xem thêm {Math.min(PAGE_SIZE, remaining)} sản phẩm
            <span style={{ opacity: 0.6, marginLeft: 6, fontSize: 12 }}>({remaining} còn lại)</span>
          </button>
        </div>
      )}
    </div>
  )
}
