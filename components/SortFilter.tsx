'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const SORT_OPTIONS = [
  { value: 'newest',     label: '🆕 Mới nhất' },
  { value: 'popular',   label: '🔥 Bán chạy' },
  { value: 'discount',  label: '💥 Giảm nhiều' },
  { value: 'price_asc', label: '💰 Giá thấp→cao' },
  { value: 'price_desc',label: '💎 Giá cao→thấp' },
]

const PRICE_RANGES = [
  { label: 'Tất cả', min: undefined, max: undefined },
  { label: 'Dưới 100k', min: 0, max: 100000 },
  { label: '100k–300k', min: 100000, max: 300000 },
  { label: '300k–500k', min: 300000, max: 500000 },
  { label: '500k–1tr', min: 500000, max: 1000000 },
  { label: 'Trên 1tr', min: 1000000, max: undefined },
]

export default function SortFilter({
  currentSort, currentMin, currentMax, catSlug, query, primary,
}: {
  currentSort: string
  currentMin?: number
  currentMax?: number
  catSlug?: string
  query?: string
  primary: string
}) {
  const router = useRouter()
  const [showPriceMenu, setShowPriceMenu] = useState(false)

  const buildUrl = (sort: string, min?: number, max?: number) => {
    const p = new URLSearchParams()
    if (catSlug) p.set('cat', catSlug)
    if (query)   p.set('q', query)
    p.set('sort', sort)
    if (min !== undefined) p.set('minPrice', String(min))
    if (max !== undefined) p.set('maxPrice', String(max))
    return '/?' + p.toString()
  }

  const activeRange = PRICE_RANGES.find(r => r.min === currentMin && r.max === currentMax) || PRICE_RANGES[0]

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>

      {/* Sort buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {SORT_OPTIONS.map(opt => (
          <button key={opt.value}
            onClick={() => router.push(buildUrl(opt.value, currentMin, currentMax))}
            style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1.5px solid ${currentSort === opt.value ? primary : '#e0e0e0'}`,
              background: currentSort === opt.value ? primary : 'white',
              color: currentSort === opt.value ? 'white' : '#555',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >{opt.label}</button>
        ))}
      </div>

      {/* Price filter dropdown */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setShowPriceMenu(v => !v)}
          style={{
            padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: `1.5px solid ${activeRange !== PRICE_RANGES[0] ? primary : '#e0e0e0'}`,
            background: activeRange !== PRICE_RANGES[0] ? `${primary}10` : 'white',
            color: activeRange !== PRICE_RANGES[0] ? primary : '#555',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          💵 {activeRange.label} ▾
        </button>
        {showPriceMenu && (
          <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, background: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', zIndex: 50, minWidth: 160, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
            {PRICE_RANGES.map((r, i) => (
              <button key={i}
                onClick={() => { setShowPriceMenu(false); router.push(buildUrl(currentSort, r.min, r.max)) }}
                style={{
                  display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
                  fontSize: 13, cursor: 'pointer', border: 'none',
                  background: activeRange === r ? `${primary}10` : 'white',
                  color: activeRange === r ? primary : '#333',
                  fontWeight: activeRange === r ? 700 : 400,
                  borderBottom: i < PRICE_RANGES.length - 1 ? '1px solid #f5f5f5' : 'none',
                }}
              >{activeRange === r ? '✓ ' : ''}{r.label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
