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
  const remaining = Math.min(PAGE_SIZE, products.length - visible)

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
              background: 'white', color: primary,
              border: `1.5px solid ${primary}`,
              padding: '12px 40px', borderRadius: 24,
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              boxShadow: `0 2px 8px ${primary}26`,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = primary
              b.style.color = 'white'
            }}
            onMouseLeave={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = 'white'
              b.style.color = primary
            }}
          >
            Xem th&#xEA;m {remaining} s&#x1EA3;n ph&#x1EA9;m &#x2193;
          </button>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>
            &#x110;ang hi&#x1EC7;n {shown.length}/{products.length} s&#x1EA3;n ph&#x1EA9;m
          </div>
        </div>
      )}
    </>
  )
}
