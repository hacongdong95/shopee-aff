'use client'

import { useState } from 'react'
import ProductCard from '@/components/ProductCard'
import ScrollReveal from '@/components/ScrollReveal'

const PAGE_SIZE = 12

type Product = any

export default function ProductGrid({ products, primary }: { products: Product[]; primary: string }) {
  const [visible, setVisible] = useState(PAGE_SIZE)

  const shown = products.slice(0, visible)
  const hasMore = visible < products.length

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        {shown.map((p: Product, i: number) => (
          <ScrollReveal key={p.id} delay={Math.min(i % 6 * 60, 300)}>
            <ProductCard product={p} />
          </ScrollReveal>
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            onClick={() => setVisible(v => v + PAGE_SIZE)}
            style={{
              background: 'white', color: '#ee4d2d',
              border: `1.5px solid #ee4d2d`,
              padding: '12px 40px', borderRadius: 24,
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(238,77,45,0.15)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#ee4d2d'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'white'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'white'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#ee4d2d'
            }}
          >
            Xem them {Math.min(PAGE_SIZE, products.length - visible)} san pham ↓
          </button>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>
            Dang hien {shown.length}/{products.length} san pham
          </div>
        </div>
      )}
    </>
  )
}
