'use client'

import { useEffect, useState } from 'react'

type Review = {
  id: number
  productId: number
  productName: string
  name: string
  rating: number
  comment: string
  isHidden: boolean
  createdAt: string
}

type Product = { id: number; name: string }

export default function ReviewsPage() {
  const [reviews, setReviews]   = useState<Review[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filterPid, setFilterPid] = useState('')
  const [generating, setGenerating] = useState<number | null>(null)
  const [genCount, setGenCount] = useState(5)
  const [loading, setLoading]   = useState(true)

  const load = async () => {
    setLoading(true)
    const [r, p] = await Promise.all([
      fetch('/api/reviews').then(x => x.json()),
      fetch('/api/products').then(x => x.json()),
    ])
    setReviews(r)
    setProducts(p)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggleHide = async (id: number, isHidden: boolean) => {
    await fetch(`/api/reviews/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isHidden: !isHidden }) })
    load()
  }

  const deleteReview = async (id: number) => {
    if (!confirm('Xóa đánh giá này?')) return
    await fetch(`/api/reviews/${id}`, { method: 'DELETE' })
    load()
  }

  const generateForProduct = async (productId: number) => {
    setGenerating(productId)
    const res = await fetch(`/api/products/${productId}/generate-reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: genCount }),
    })
    const data = await res.json()
    setGenerating(null)
    if (data.ok) { alert(`✅ Đã tạo ${data.count} đánh giá!`); load() }
    else alert(`❌ ${data.error}`)
  }

  const stars = (n: number) => '⭐'.repeat(n)

  const filtered = reviews.filter(r => !filterPid || String(r.productId) === filterPid)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>💬 Quản lý đánh giá</h2>
          <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: 13 }}>{reviews.length} đánh giá tổng cộng · {reviews.filter(r => !r.isHidden).length} đang hiện</p>
        </div>
      </div>

      {/* Generate section */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🤖</span> Generate đánh giá bằng AI
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none' }}
            onChange={e => setFilterPid(e.target.value)}
            value={filterPid}
          >
            <option value="">-- Chọn sản phẩm --</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name.slice(0, 60)}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>Số lượng:</span>
            <select value={genCount} onChange={e => setGenCount(Number(e.target.value))}
              style={{ padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none' }}>
              {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n} đánh giá</option>)}
            </select>
          </div>
          <button
            onClick={() => filterPid && generateForProduct(Number(filterPid))}
            disabled={!filterPid || generating !== null}
            style={{ background: !filterPid || generating !== null ? '#9ca3af' : '#7c3aed', color: 'white', border: 'none', padding: '9px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: !filterPid || generating !== null ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
            {generating !== null ? '⏳ Đang tạo...' : '✨ Generate'}
          </button>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: '#9ca3af' }}>
          AI sẽ tạo đánh giá phù hợp với sản phẩm, rating 4-5 sao, tên người Việt ngẫu nhiên, ngày trải rộng 3 tháng qua
        </div>
      </div>

      {/* Filter + list */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Lọc theo sản phẩm:</span>
          <select value={filterPid} onChange={e => setFilterPid(e.target.value)}
            style={{ padding: '6px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', flex: 1, minWidth: 200 }}>
            <option value="">Tất cả sản phẩm</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name.slice(0, 60)}</option>)}
          </select>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{filtered.length} đánh giá</span>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>⏳ Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
            <p>Chưa có đánh giá nào</p>
          </div>
        ) : (
          <div>
            {filtered.map((r, i) => (
              <div key={r.id} style={{ padding: '16px 20px', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none', opacity: r.isHidden ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {/* Avatar */}
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: `hsl(${r.id * 47 % 360}, 60%, 70%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                    {r.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</span>
                      <span style={{ fontSize: 13 }}>{stars(r.rating)}</span>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                      {r.isHidden && <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20 }}>Đang ẩn</span>}
                    </div>
                    <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 6 }}>{r.comment}</div>
                    <div style={{ fontSize: 11, color: '#ee4d2d', fontWeight: 600 }}>
                      📦 {products.find(p => p.id === r.productId)?.name?.slice(0, 50) || `SP #${r.productId}`}
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => toggleHide(r.id, r.isHidden)} style={{ padding: '5px 12px', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#374151' }}>
                      {r.isHidden ? '👁 Hiện' : '🚫 Ẩn'}
                    </button>
                    <button onClick={() => deleteReview(r.id)} style={{ padding: '5px 10px', border: '1.5px solid #fca5a5', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#ef4444' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
