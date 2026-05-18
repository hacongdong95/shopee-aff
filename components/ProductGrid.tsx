'use client'

import { useState, useEffect, useRef } from 'react'
import ProductCard from '@/components/ProductCard'
import ScrollReveal from '@/components/ScrollReveal'

const PAGE_SIZE = 12

type Product = any

export default function ProductGrid({ products, primary }: { products: Product[]; primary: string }) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  const shown = products.slice(0, visible)
  const hasMore = visible < products.length

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setLoading(true)
          setTimeout(() => {
            setVisible(v => v + PAGE_SIZE)
            setLoading(false)
          }, 400)
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading])

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        {shown.map((p: Product, i: number) => (
          <ScrollReveal key={p.id} delay={Math.min((i % 6) * 60, 300)}>
            <ProductCard product={p} />
          </ScrollReveal>
        ))}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loaderRef} style={{ textAlign: 'center', marginTop: 32, minHeight: 60 }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#aaa' }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              border: `2px solid ${primary}33`,
              borderTop: `2px solid ${primary}`,
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: 13 }}>Đang tải thêm...</span>
          </div>
        )}
        {!hasMore && products.length > PAGE_SIZE && (
          <div style={{ fontSize: 12, color: '#ccc', padding: '8px 0' }}>
            ✓ Đã hiện tất cả {products.length} sản phẩm
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </>
  )
}
