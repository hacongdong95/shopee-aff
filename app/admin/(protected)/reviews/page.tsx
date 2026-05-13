'use client'

import { useEffect, useState } from 'react'

const PRIMARY = '#ee4d2d'

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

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#f5a623', fontSize: 13 }}>
      {'⭐'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export default function ReviewsAdminPage() {
  const [reviews, setReviews]     = useState<Review[]>([])
  const [products, setProducts]   = useState<Product[]>([])
  const [loading, setLoading]     = useState(true)
  const [filterProd, setFilterProd] = useState('')
  const [search, setSearch]       = useState('')

  const [selected, setSelected]   = useState<Set<number>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm]   = useState({ name: '', rating: 5, comment: '' })

  // Generate — single
  const [genMode, setGenMode]     = useState<'single' | 'all'>('single')
  const [genProd, setGenProd]     = useState('')
  const [genCount, setGenCount]   = useState('7')
  const [generating, setGenerating] = useState(false)
  const [genMsg, setGenMsg]       = useState('')

  // Generate — all products progress
  const [genAllLog, setGenAllLog] = useState<{ name: string; status: 'pending' | 'done' | 'error'; msg?: string }[]>([])
  const [genAllIdx, setGenAllIdx] = useState(-1) // -1 = not started

  const load = async () => {
    setLoading(true)
    const [r, p] = await Promise.all([
      fetch('/api/reviews').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
    ])
    setReviews(Array.isArray(r) ? r : [])
    setProducts(Array.isArray(p) ? p : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ── Select helpers ──────────────────────────────────────────────────────
  const toggleSelect = (id: number) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const toggleSelectAll = (ids: number[]) => {
    const allSel = ids.every(id => selected.has(id))
    if (allSel) setSelected(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n })
    else setSelected(prev => { const n = new Set(prev); ids.forEach(id => n.add(id)); return n })
  }
  const bulkDelete = async () => {
    if (!confirm(`Xóa ${selected.size} đánh giá?`)) return
    setBulkDeleting(true)
    await Promise.all([...selected].map(id => fetch(`/api/reviews/${id}`, { method: 'DELETE' })))
    setSelected(new Set()); setBulkDeleting(false); load()
  }
  const bulkToggleHide = async (hide: boolean) => {
    if (selected.size === 0) return
    await Promise.all([...selected].map(id =>
      fetch(`/api/reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isHidden: hide }) })
    ))
    setSelected(new Set()); load()
  }

  // ── Edit helpers ────────────────────────────────────────────────────────
  const startEdit = (r: Review) => { setEditingId(r.id); setEditForm({ name: r.name, rating: r.rating, comment: r.comment }) }
  const saveEdit = async (id: number) => {
    await fetch(`/api/reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    setEditingId(null)
    setReviews(prev => prev.map(r => r.id === id ? { ...r, ...editForm } : r))
  }
  const toggle = async (id: number, isHidden: boolean) => {
    await fetch(`/api/reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isHidden: !isHidden }) })
    setReviews(r => r.map(rv => rv.id === id ? { ...rv, isHidden: !isHidden } : rv))
  }
  const del = async (id: number) => {
    if (!confirm('Xóa đánh giá này?')) return
    await fetch(`/api/reviews/${id}`, { method: 'DELETE' })
    setReviews(r => r.filter(rv => rv.id !== id))
  }

  // ── Generate single ─────────────────────────────────────────────────────
  const generate = async () => {
    if (!genProd) { setGenMsg('❌ Chọn sản phẩm trước!'); return }
    const prod = products.find(p => String(p.id) === genProd)
    if (!prod) return
    setGenerating(true); setGenMsg('⏳ Đang generate...')
    try {
      const res  = await fetch('/api/reviews/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: prod.id, productName: prod.name, count: Number(genCount) }),
      })
      const data = await res.json()
      if (data.ok) { setGenMsg(`✅ Đã tạo ${data.count} review cho "${prod.name}"`); load() }
      else setGenMsg(`❌ ${data.error || 'Lỗi không xác định'}`)
    } catch (e) { setGenMsg(`❌ Lỗi: ${e}`) }
    finally { setGenerating(false) }
  }

  // ── Generate ALL products ───────────────────────────────────────────────
  const generateAll = async () => {
    if (products.length === 0) return
    if (!confirm(`Generate ${genCount} review cho TẤT CẢ ${products.length} sản phẩm?\n\nQuá trình này sẽ mất vài phút.`)) return

    // Init log
    const log = products.map(p => ({ name: p.name, status: 'pending' as const }))
    setGenAllLog(log)
    setGenerating(true)
    setGenMsg('')

    for (let i = 0; i < products.length; i++) {
      const prod = products[i]
      setGenAllIdx(i)

      // Cập nhật status → đang xử lý
      setGenAllLog(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'pending', msg: '⏳ Đang tạo...' } : item))

      try {
        const res  = await fetch('/api/reviews/generate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: prod.id, productName: prod.name, count: Number(genCount) }),
        })
        const data = await res.json()
        if (data.ok) {
          setGenAllLog(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'done', msg: `✅ +${data.count} review` } : item))
        } else {
          setGenAllLog(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'error', msg: `❌ ${data.error || 'Lỗi'}` } : item))
        }
      } catch (e) {
        setGenAllLog(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'error', msg: `❌ ${e}` } : item))
      }

      // Delay giữa các request tránh rate limit
      if (i < products.length - 1) await new Promise(r => setTimeout(r, 1200))
    }

    setGenerating(false)
    setGenAllIdx(-1)
    setGenMsg(`🎉 Hoàn tất! Đã xử lý ${products.length} sản phẩm.`)
    load()
  }

  const filtered = reviews.filter(r => {
    if (filterProd && String(r.productId) !== filterProd) return false
    if (search && !r.comment.toLowerCase().includes(search.toLowerCase()) && !r.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const filteredIds          = filtered.map(r => r.id)
  const allFilteredSelected  = filteredIds.length > 0 && filteredIds.every(id => selected.has(id))
  const hidden               = filtered.filter(r => r.isHidden).length
  const visible              = filtered.filter(r => !r.isHidden).length
  const doneCount            = genAllLog.filter(l => l.status === 'done').length
  const progressPct          = genAllLog.length > 0 ? Math.round(doneCount / genAllLog.length * 100) : 0

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>💬 Quản lý đánh giá</h2>

      {/* ── Generate box ── */}
      <div style={{ background: 'white', borderRadius: 12, padding: '18px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1.5px solid ${PRIMARY}22` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: PRIMARY, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          🤖 Generate Review bằng AI (Groq)
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => { setGenMode('single'); setGenAllLog([]) }}
            style={{ padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: genMode === 'single' ? PRIMARY : '#f3f4f6', color: genMode === 'single' ? 'white' : '#374151', transition: 'all 0.15s' }}>
            1️⃣ Một sản phẩm
          </button>
          <button onClick={() => { setGenMode('all'); setGenMsg('') }}
            style={{ padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: genMode === 'all' ? PRIMARY : '#f3f4f6', color: genMode === 'all' ? 'white' : '#374151', transition: 'all 0.15s' }}>
            🚀 Tất cả sản phẩm ({products.length})
          </button>
        </div>

        {/* Số lượng review (dùng chung cả 2 mode) */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>

          {/* Single mode: chọn sản phẩm */}
          {genMode === 'single' && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Sản phẩm</div>
              <select value={genProd} onChange={e => setGenProd(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none' }}>
                <option value="">-- Chọn sản phẩm --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {/* All mode: info */}
          {genMode === 'all' && (
            <div style={{ flex: 1, minWidth: 200, background: '#fff7ed', borderRadius: 8, padding: '10px 14px', border: '1px solid #fed7aa', fontSize: 13, color: '#92400e' }}>
              ⚡ Sẽ generate review cho <strong>tất cả {products.length} sản phẩm</strong> lần lượt. Mỗi sản phẩm cách nhau ~1.2s để tránh rate limit.
            </div>
          )}

          <div style={{ width: 110 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Số review/SP</div>
            <select value={genCount} onChange={e => setGenCount(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none' }}>
              {[3, 5, 10, 20, 30, 50].map(n => <option key={n} value={n}>{n} review</option>)}
            </select>
          </div>

          <button
            onClick={genMode === 'single' ? generate : generateAll}
            disabled={generating}
            style={{ padding: '9px 22px', background: generating ? '#9ca3af' : PRIMARY, color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: generating ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
            {generating
              ? genMode === 'all' ? `⏳ ${doneCount}/${products.length}...` : '⏳ Đang tạo...'
              : genMode === 'all' ? `🚀 Gen tất cả ${products.length} SP` : '🚀 Generate'}
          </button>
        </div>

        {/* Progress bar (all mode) */}
        {genMode === 'all' && genAllLog.length > 0 && (
          <div style={{ marginTop: 14 }}>
            {/* Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
              <span>Tiến độ: {doneCount}/{genAllLog.length} sản phẩm</span>
              <span style={{ fontWeight: 700, color: PRIMARY }}>{progressPct}%</span>
            </div>
            <div style={{ height: 8, background: '#f3f4f6', borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: `linear-gradient(90deg, ${PRIMARY}, #ff7043)`, borderRadius: 8, transition: 'width 0.4s ease' }} />
            </div>

            {/* Log list */}
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {genAllLog.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 6, fontSize: 12,
                  background: item.status === 'done' ? '#f0fdf4' : item.status === 'error' ? '#fef2f2' : i === genAllIdx ? '#fff7ed' : '#fafafa',
                  border: `1px solid ${item.status === 'done' ? '#bbf7d0' : item.status === 'error' ? '#fecaca' : i === genAllIdx ? '#fed7aa' : '#f0f0f0'}`,
                }}>
                  <span style={{ flexShrink: 0 }}>
                    {item.status === 'done' ? '✅' : item.status === 'error' ? '❌' : i === genAllIdx ? '⏳' : '⬜'}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151' }}>{item.name}</span>
                  {item.msg && <span style={{ color: item.status === 'done' ? '#059669' : item.status === 'error' ? '#dc2626' : '#92400e', fontWeight: 600, flexShrink: 0 }}>{item.msg}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {genMsg && (
          <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: genMsg.startsWith('✅') || genMsg.startsWith('🎉') ? '#059669' : genMsg.startsWith('⏳') ? '#6b7280' : '#dc2626' }}>
            {genMsg}
          </div>
        )}
      </div>

      {/* Filter + stats */}
      <div style={{ background: 'white', borderRadius: 12, padding: '12px 16px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="checkbox"
          checked={allFilteredSelected}
          onChange={() => toggleSelectAll(filteredIds)}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: PRIMARY }}
          title="Chọn tất cả"
        />
        <select value={filterProd} onChange={e => setFilterProd(e.target.value)}
          style={{ padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none' }}>
          <option value="">Tất cả sản phẩm</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Tìm tên / nội dung..."
          style={{ flex: 1, minWidth: 180, padding: '8px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none' }} />
        <div style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#059669', fontWeight: 700 }}>{visible} hiện</span>
          {' · '}
          <span style={{ color: '#9ca3af' }}>{hidden} ẩn</span>
          {' · '}tổng {filtered.length}
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>✓ Đã chọn {selected.size} đánh giá</span>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button onClick={() => bulkToggleHide(true)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 7, cursor: 'pointer', background: '#fef9c3', color: '#b45309' }}>🙈 Ẩn tất cả</button>
            <button onClick={() => bulkToggleHide(false)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 7, cursor: 'pointer', background: '#d1fae5', color: '#065f46' }}>👁 Hiện tất cả</button>
            <button onClick={bulkDelete} disabled={bulkDeleting} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 7, cursor: bulkDeleting ? 'not-allowed' : 'pointer', background: '#fee2e2', color: '#dc2626' }}>
              {bulkDeleting ? '⏳ Đang xóa...' : `🗑 Xóa ${selected.size} cái`}
            </button>
            <button onClick={() => setSelected(new Set())} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, border: '1px solid #e5e7eb', borderRadius: 7, cursor: 'pointer', background: 'white', color: '#6b7280' }}>✕ Bỏ chọn</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', background: 'white', borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <div>Chưa có đánh giá nào</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(r => (
            <div key={r.id} style={{
              borderRadius: 10, padding: '14px 16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
              opacity: r.isHidden ? 0.55 : 1,
              border: selected.has(r.id) ? `1.5px solid ${PRIMARY}` : r.isHidden ? '1.5px dashed #e5e7eb' : '1.5px solid transparent',
              display: 'flex', gap: 14, alignItems: 'flex-start',
              background: selected.has(r.id) ? `${PRIMARY}06` : 'white',
            }}>
              <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: PRIMARY, marginTop: 2, flexShrink: 0 }} />
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${PRIMARY}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, border: `1.5px solid ${PRIMARY}22` }}>👤</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingId === r.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Tên người đánh giá"
                        style={{ padding: '7px 12px', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none' }} />
                      <select value={editForm.rating} onChange={e => setEditForm(f => ({ ...f, rating: Number(e.target.value) }))}
                        style={{ padding: '7px 12px', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none' }}>
                        {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} sao {'⭐'.repeat(n)}</option>)}
                      </select>
                    </div>
                    <textarea value={editForm.comment} onChange={e => setEditForm(f => ({ ...f, comment: e.target.value }))} rows={3}
                      style={{ padding: '8px 12px', border: '1.5px solid #ee4d2d', borderRadius: 7, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => saveEdit(r.id)} style={{ padding: '6px 16px', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 7, cursor: 'pointer', background: PRIMARY, color: 'white' }}>💾 Lưu</button>
                      <button onClick={() => setEditingId(null)} style={{ padding: '6px 16px', fontSize: 12, fontWeight: 700, border: '1px solid #e5e7eb', borderRadius: 7, cursor: 'pointer', background: 'white', color: '#6b7280' }}>Hủy</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#222' }}>{r.name}</span>
                      <Stars rating={r.rating} />
                      {r.isHidden && <span style={{ fontSize: 11, background: '#f3f4f6', color: '#9ca3af', padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>ẨN</span>}
                    </div>
                    <div style={{ fontSize: 13, color: '#444', lineHeight: 1.6, marginBottom: 6 }}>{r.comment}</div>
                    <div style={{ fontSize: 11, color: '#bbb' }}>{r.productName} · {new Date(r.createdAt).toLocaleDateString('vi-VN')}</div>
                  </>
                )}
              </div>
              {editingId !== r.id && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => startEdit(r)} style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, border: '1.5px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', background: '#eff6ff', color: '#2563eb' }}>✏️</button>
                  <button onClick={() => toggle(r.id, r.isHidden)} style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, border: '1.5px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', background: 'white', color: r.isHidden ? '#059669' : '#6b7280' }}>{r.isHidden ? '👁' : '🙈'}</button>
                  <button onClick={() => del(r.id)} style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, border: '1.5px solid #fecaca', borderRadius: 6, cursor: 'pointer', background: '#fef2f2', color: '#dc2626' }}>🗑</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
