'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Suggestion = {
  id: number
  name: string
  slug: string
  price: number
  oldPrice: number | null
  imageUrl: string | null
  category: { name: string }
}

function parseFirstImage(imageUrl: string | null): string | null {
  if (!imageUrl) return null
  return imageUrl.split('\n')[0].trim() || null
}

export default function SearchBox({
  defaultValue = '',
  primary = '#ee4d2d',
  catSlug,
}: {
  defaultValue?: string
  primary?: string
  catSlug?: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue)
  const [results, setResults] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`)
        const data = await res.json()
        setResults(Array.isArray(data) ? data : [])
        setOpen(true)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 220)
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveIdx(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const go = (q: string) => {
    setOpen(false)
    const params = new URLSearchParams()
    params.set('q', q)
    if (catSlug) params.set('cat', catSlug)
    router.push('/?' + params.toString())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) {
      if (e.key === 'Enter') go(query)
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0) router.push(`/san-pham/${results[activeIdx].slug}`)
      else go(query)
      setOpen(false)
    }
    else if (e.key === 'Escape') { setOpen(false); setActiveIdx(-1) }
  }

  return (
    <div ref={wrapRef} style={{ flex: 1, maxWidth: 560, position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(-1) }}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Tìm kiếm sản phẩm giảm giá..."
          style={{
            width: '100%', padding: '11px 50px 11px 20px', borderRadius: 24,
            border: 'none', fontSize: 14, outline: 'none',
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)',
            transition: 'box-shadow 0.2s',
          }}
        />
        <button
          onClick={() => go(query)}
          style={{
            position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)',
            background: loading ? `${primary}99` : primary, border: 'none', borderRadius: 20,
            width: 36, height: 36, cursor: 'pointer', fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 2px 8px ${primary}66`, transition: 'background 0.15s',
          }}
        >
          {loading ? '⏳' : '🔍'}
        </button>
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: 'white', borderRadius: 16, zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #f0f0f0',
          overflow: 'hidden',
        }}>
          {results.map((p, i) => {
            const thumb = parseFirstImage(p.imageUrl)
            const disc = p.oldPrice && p.oldPrice > p.price
              ? Math.round((1 - p.price / p.oldPrice) * 100) : null
            const active = i === activeIdx
            return (
              <div
                key={p.id}
                onMouseDown={() => router.push(`/san-pham/${p.slug}`)}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', cursor: 'pointer',
                  background: active ? '#fff5f3' : 'white',
                  borderBottom: i < results.length - 1 ? '1px solid #f9f9f9' : 'none',
                  transition: 'background 0.1s',
                }}
              >
                {/* Thumbnail */}
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#fafafa', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {thumb
                    ? <img src={thumb} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <span style={{ fontSize: 20 }}>🛍️</span>}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{p.category.name}</div>
                </div>

                {/* Price */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: primary }}>{p.price.toLocaleString('vi-VN')}đ</div>
                  {disc && <div style={{ fontSize: 10, background: primary, color: 'white', padding: '1px 5px', borderRadius: 4, marginTop: 2 }}>-{disc}%</div>}
                </div>
              </div>
            )
          })}

          {/* Xem tất cả */}
          <div
            onMouseDown={() => go(query)}
            style={{
              padding: '10px 14px', textAlign: 'center', fontSize: 13,
              color: primary, fontWeight: 600, cursor: 'pointer',
              background: '#fff8f7', borderTop: '1px solid #f0f0f0',
            }}
          >
            🔍 Xem tất cả kết quả cho "{query}"
          </div>
        </div>
      )}

      {/* Không tìm thấy */}
      {open && results.length === 0 && !loading && query.trim().length >= 2 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: 'white', borderRadius: 16, zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #f0f0f0',
          padding: '20px', textAlign: 'center', color: '#999', fontSize: 13,
        }}>
          Không tìm thấy sản phẩm nào cho "{query}"
        </div>
      )}
    </div>
  )
}
