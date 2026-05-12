'use client'

import { useEffect, useState } from 'react'

type Category = { id: number; name: string; parentId: number | null }

function flatTreeOptions(cats: Category[]): { id: number; label: string }[] {
  const map: Record<number, Category & { children: Category[] }> = {}
  cats.forEach(c => { map[c.id] = { ...c, children: [] } })
  const roots: (Category & { children: Category[] })[] = []
  cats.forEach(c => {
    if (c.parentId && map[c.parentId]) map[c.parentId].children.push(map[c.id])
    else roots.push(map[c.id])
  })
  const result: { id: number; label: string }[] = []
  const walk = (node: Category & { children: Category[] }) => {
    result.push({ id: node.id, label: node.parentId ? `  └─ ${node.name}` : `📁 ${node.name}` })
    node.children.forEach(walk)
  }
  roots.forEach(walk)
  return result
}
type Product = {
  id: number; name: string; price: number; oldPrice: number | null
  imageUrl: string | null; affLink: string; isActive: boolean
  clicks: number; category: Category; categoryId: number
  description: string | null
}

const empty = {
  name: '', description: '', price: '', oldPrice: '',
  imageUrl: '', affLink: '', categoryId: '', isActive: true,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #e5e7eb', borderRadius: 8,
  fontSize: 14, outline: 'none', background: 'white',
  boxSizing: 'border-box',
}

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#ee4d2d' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function extractNameFromUrl(url: string): string {
  try {
    const decoded = decodeURIComponent(url)
    const match = decoded.match(/shopee\.vn\/([^?#]+)/)
    if (!match) return ''
    return match[1]
      .replace(/-i\.\d+\.\d+.*$/, '')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  } catch { return '' }
}

export default function ProductsPage() {
  const [products, setProducts]     = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm]             = useState<typeof empty & { id?: number }>(empty)
  const [showForm, setShowForm]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll]   = useState(false) // chọn tất cả mọi trang
  const [deleting, setDeleting]     = useState(false)

  // Quick edit
  const [quickEdit, setQuickEdit] = useState<{ id: number; price: string; oldPrice: string } | null>(null)

  // Import hàng loạt
  const [showImport, setShowImport]   = useState(false)
  const [importLinks, setImportLinks] = useState('')
  const [importCat, setImportCat]     = useState('')
  const [importing, setImporting]     = useState(false)
  const [importLog, setImportLog]     = useState<{ text: string; status: 'ok' | 'err' | 'info' | 'done' }[]>([])

  // Scrape
  const [scrapeUrl, setScrapeUrl]           = useState('')
  const [scraping, setScraping]             = useState(false)
  const [scrapeMsg, setScrapeMsg]           = useState('')
  const [fetchingImages, setFetchingImages] = useState(false)

  const load = async () => {
    const [p, c] = await Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ])
    setProducts(p)
    setCategories(c)
    setSelected(new Set())
    setSelectAll(false)
  }

  useEffect(() => { load() }, [])

  const openNew  = () => { setForm(empty); setScrapeUrl(''); setScrapeMsg(''); setShowForm(true) }
  const openEdit = (p: Product) => {
    setForm({ id: p.id, name: p.name, description: p.description || '', price: String(p.price), oldPrice: p.oldPrice ? String(p.oldPrice) : '', imageUrl: p.imageUrl || '', affLink: p.affLink, categoryId: String(p.categoryId), isActive: p.isActive })
    setScrapeUrl(''); setScrapeMsg(''); setShowForm(true)
  }

  // ── Duplicate ─────────────────────────────────────────────────────────────
  const duplicate = async (p: Product) => {
    if (!confirm(`Nhân bản "${p.name}"?`)) return
    await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: p.name + ' (copy)', description: p.description, price: p.price, oldPrice: p.oldPrice, imageUrl: p.imageUrl, affLink: p.affLink, categoryId: p.categoryId, isActive: false }) })
    load()
  }

  // ── Quick edit ────────────────────────────────────────────────────────────
  const saveQuickEdit = async () => {
    if (!quickEdit) return
    await fetch(`/api/products/${quickEdit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price: Number(quickEdit.price), oldPrice: quickEdit.oldPrice ? Number(quickEdit.oldPrice) : null }) })
    setQuickEdit(null); load()
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const getSelectedIds = () => selectAll ? products.map(p => p.id) : [...selected]

  const bulkToggle = async (active: boolean) => {
    const ids = getSelectedIds()
    if (ids.length === 0) return
    await Promise.all(ids.map(id => fetch(`/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: active }) })))
    load()
  }

  const deleteSelected = async () => {
    const ids = getSelectedIds()
    if (!confirm(`Xóa ${ids.length} sản phẩm đã chọn?`)) return
    setDeleting(true)
    await Promise.all(ids.map(id => fetch(`/api/products/${id}`, { method: 'DELETE' })))
    setDeleting(false); load()
  }

  // ── Chọn tất cả kiểu Gmail ───────────────────────────────────────────────
  const toggleSelectFiltered = () => {
    if (selectAll) { setSelectAll(false); setSelected(new Set()); return }
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set()); return
    }
    setSelected(new Set(filtered.map(p => p.id)))
  }

  const handleSelectAll = () => { setSelectAll(true); setSelected(new Set()) }

  // ── Import hàng loạt (kiểu A) ─────────────────────────────────────────────
  const handleImport = async () => {
    const links = importLinks.split('\n').map(l => l.trim()).filter(l => l.includes('shopee'))
    if (links.length === 0) { alert('Không tìm thấy link Shopee hợp lệ!'); return }
    if (!importCat) { alert('Chọn danh mục trước!'); return }
    setImporting(true)
    setImportLog([{ text: `🚀 Bắt đầu import ${links.length} link...`, status: 'info' }])

    let ok = 0; let fail = 0
    for (let i = 0; i < links.length; i++) {
      const url  = links[i]
      const name = extractNameFromUrl(url) || `Sản phẩm ${i + 1}`
      setImportLog(prev => [...prev, { text: `⏳ [${i+1}/${links.length}] ${name}`, status: 'info' }])
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description: null,
            price: 99000,
            oldPrice: 124000,
            imageUrl: null,
            affLink: url,
            categoryId: Number(importCat),
            isActive: false, // ẩn mặc định, cần vào sửa thêm ảnh/giá
          }),
        })
        setImportLog(prev => [...prev.slice(0, -1), { text: `✅ [${i+1}/${links.length}] ${name}`, status: 'ok' }])
        ok++
      } catch (e) {
        setImportLog(prev => [...prev.slice(0, -1), { text: `❌ [${i+1}/${links.length}] Lỗi: ${e}`, status: 'err' }])
        fail++
      }
      await new Promise(r => setTimeout(r, 200))
    }

    setImportLog(prev => [...prev, { text: `🎉 Xong! ${ok} thành công, ${fail} thất bại. Vào sửa từng sản phẩm để thêm ảnh & chỉnh giá.`, status: 'done' }])
    setImporting(false)
    load()
  }

  // ── Scrape ────────────────────────────────────────────────────────────────
  const handleScrape = async () => {
    if (!scrapeUrl.includes('shopee')) { setScrapeMsg('❌ Link Shopee không hợp lệ'); return }
    setScraping(true); setScrapeMsg('⏳ Đang lấy thông tin...')
    try {
      const res = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: scrapeUrl }) })
      const data = await res.json()
      if (!res.ok || data.error) { setScrapeMsg(`❌ ${data.error || 'Thất bại'}`); return }
      setForm(f => ({ ...f, name: data.name || f.name, description: data.description || f.description, price: data.price ? String(data.price) : f.price, oldPrice: data.oldPrice ? String(data.oldPrice) : f.oldPrice, affLink: scrapeUrl }))
      setScrapeMsg('✅ Đã điền! Kiểm tra lại và bấm 🖼️ Lấy ảnh.')
    } catch (e) { setScrapeMsg(`❌ ${e}`) }
    finally { setScraping(false) }
  }

  const handleFetchImages = async () => {
    const link = form.affLink || scrapeUrl
    if (!link) { setScrapeMsg('❌ Nhập link Shopee trước!'); return }
    setFetchingImages(true); setScrapeMsg('⏳ Đang lấy ảnh...')
    try {
      const res = await fetch('/api/shopee-images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: link }) })
      const data = await res.json()
      if (!res.ok || data.error) { setScrapeMsg(`❌ ${data.error}`); return }
      setForm(f => ({ ...f, imageUrl: data.imageUrls.join('\n') }))
      setScrapeMsg(`✅ Lấy được ${data.count} ảnh!`)
    } catch (e) { setScrapeMsg(`❌ ${e}`) }
    finally { setFetchingImages(false) }
  }

  const save = async () => {
    if (!form.name || !form.price || !form.affLink || !form.categoryId) { alert('Điền đầy đủ các trường bắt buộc!'); return }
    setLoading(true)
    const res = await fetch(form.id ? `/api/products/${form.id}` : '/api/products', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    // Nếu thêm mới → tự động generate reviews
    if (!form.id && res.ok) {
      const newProduct = await res.json()
      if (newProduct?.id) {
        fetch('/api/reviews/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: newProduct.id, productName: form.name, count: 7 }),
        }).catch(() => {}) // fire & forget, không block UI
      }
    }
    setLoading(false); setShowForm(false); load()
  }

  const del = async (id: number) => {
    if (!confirm('Xóa sản phẩm này?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' }); load()
  }

  const filtered    = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const someSelected = selectAll || selected.size > 0
  const selectedCount = selectAll ? products.length : selected.size
  const allFilteredSelected = !selectAll && selected.size === filtered.length && filtered.length > 0
  const disc = (price: number, old: number | null) => old && old > price ? Math.round((1 - price / old) * 100) : null

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Quản lý sản phẩm</h2>
          <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: 13 }}>{products.length} sản phẩm tổng cộng</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setShowImport(true); setImportLog([]) }} style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            📥 Import hàng loạt
          </button>
          <button onClick={openNew} style={{ background: '#ee4d2d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* ── Search + toolbar ── */}
      <div style={{ background: 'white', borderRadius: someSelected ? '10px 10px 0 0' : 10, padding: '10px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: someSelected ? 0 : 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <input type="checkbox"
          checked={allFilteredSelected || selectAll}
          ref={el => { if (el) el.indeterminate = selected.size > 0 && !allFilteredSelected && !selectAll }}
          onChange={toggleSelectFiltered}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#ee4d2d' }} />
        <span style={{ color: '#9ca3af' }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm sản phẩm..."
          style={{ border: 'none', outline: 'none', fontSize: 14, flex: 1, background: 'transparent', minWidth: 150 }} />
      </div>

      {/* ── Bulk action bar (kiểu Gmail) ── */}
      {someSelected && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
            {selectAll ? `Tất cả ${products.length} sản phẩm đã được chọn` : `Đã chọn ${selectedCount} sản phẩm`}
          </span>
          {!selectAll && allFilteredSelected && filtered.length < products.length && (
            <button onClick={handleSelectAll} style={{ background: 'none', border: 'none', color: '#ee4d2d', fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Chọn tất cả {products.length} sản phẩm
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={() => bulkToggle(true)} style={{ background: '#059669', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            👁 Hiện
          </button>
          <button onClick={() => bulkToggle(false)} style={{ background: '#6b7280', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            🚫 Ẩn
          </button>
          <button onClick={deleteSelected} disabled={deleting} style={{ background: deleting ? '#fca5a5' : '#ef4444', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            🗑️ Xóa {selectedCount}
          </button>
          <button onClick={() => { setSelected(new Set()); setSelectAll(false) }} style={{ background: 'white', border: '1.5px solid #e5e7eb', color: '#6b7280', padding: '6px 12px', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            Bỏ chọn
          </button>
        </div>
      )}

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, padding: 60, textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p>Chưa có sản phẩm nào</p>
          <button onClick={openNew} style={{ background: '#ee4d2d', color: 'white', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>+ Thêm ngay</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>
          {filtered.map(p => {
            const isSelected  = selectAll || selected.has(p.id)
            const isQuickEdit = quickEdit?.id === p.id
            return (
              <div key={p.id} style={{ background: 'white', borderRadius: 12, boxShadow: isSelected ? '0 0 0 2px #ee4d2d, 0 1px 4px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'box-shadow 0.15s' }}>

                {/* Checkbox */}
                <div onClick={() => { if (selectAll) { setSelectAll(false); const s = new Set(products.map(x => x.id)); s.delete(p.id); setSelected(s) } else { toggleSelectFiltered(); const next = new Set(selected); next.has(p.id) ? next.delete(p.id) : next.add(p.id); setSelected(next) } }}
                  style={{ position: 'absolute', top: 8, left: 8, zIndex: 10, width: 22, height: 22, borderRadius: 6, background: isSelected ? '#ee4d2d' : 'rgba(255,255,255,0.9)', border: isSelected ? '2px solid #ee4d2d' : '2px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'all 0.15s' }}>
                  {isSelected && <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>✓</span>}
                </div>

                <div style={{ position: 'relative', paddingTop: '100%', background: '#f5f5f5' }}>
                  {p.imageUrl
                    ? <img src={p.imageUrl.split('\n')[0].trim()} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#d1d5db' }}>🛍️</div>
                  }
                  {disc(p.price, p.oldPrice) && (
                    <div style={{ position: 'absolute', top: 8, right: 8, background: '#ee4d2d', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>-{disc(p.price, p.oldPrice)}%</div>
                  )}
                  <div style={{ position: 'absolute', bottom: 8, right: 8, background: p.isActive ? '#d1fae5' : '#fee2e2', color: p.isActive ? '#065f46' : '#991b1b', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                    {p.isActive ? 'Hiện' : 'Ẩn'}
                  </div>
                </div>

                <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#ee4d2d', fontWeight: 600 }}>{p.category.name}</div>

                  {isQuickEdit ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      <input type="number" value={quickEdit.price} onChange={e => setQuickEdit(q => q ? { ...q, price: e.target.value } : q)} placeholder="Giá hiện tại" style={{ ...inputStyle, padding: '6px 10px', fontSize: 12 }} />
                      <input type="number" value={quickEdit.oldPrice} onChange={e => setQuickEdit(q => q ? { ...q, oldPrice: e.target.value } : q)} placeholder="Giá cũ" style={{ ...inputStyle, padding: '6px 10px', fontSize: 12 }} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={saveQuickEdit} style={{ flex: 1, padding: '6px', background: '#059669', color: 'white', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>✓ Lưu</button>
                        <button onClick={() => setQuickEdit(null)} style={{ flex: 1, padding: '6px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ color: '#ee4d2d', fontWeight: 700, fontSize: 16 }}>{p.price.toLocaleString('vi-VN')}đ</span>
                        {p.oldPrice && <span style={{ color: '#9ca3af', fontSize: 12, textDecoration: 'line-through' }}>{p.oldPrice.toLocaleString('vi-VN')}đ</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>👆 {p.clicks} lượt click</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button onClick={() => openEdit(p)} style={{ flex: 1, padding: '6px', border: '1.5px solid #ee4d2d', borderRadius: 7, color: '#ee4d2d', background: 'white', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Sửa</button>
                        <button onClick={() => setQuickEdit({ id: p.id, price: String(p.price), oldPrice: p.oldPrice ? String(p.oldPrice) : '' })} style={{ flex: 1, padding: '6px', border: '1.5px solid #7c3aed', borderRadius: 7, color: '#7c3aed', background: 'white', fontWeight: 600, fontSize: 12, cursor: 'pointer' }} title="Sửa nhanh giá">💰</button>
                        <button onClick={() => duplicate(p)} style={{ flex: 1, padding: '6px', border: '1.5px solid #059669', borderRadius: 7, color: '#059669', background: 'white', fontWeight: 600, fontSize: 12, cursor: 'pointer' }} title="Nhân bản">⎘</button>
                        <button onClick={() => del(p.id)} style={{ flex: 1, padding: '6px', border: '1.5px solid #e5e7eb', borderRadius: 7, color: '#6b7280', background: 'white', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal Import hàng loạt ── */}
      {showImport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget && !importing) setShowImport(false) }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>📥 Import hàng loạt</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Tạo nhanh nhiều sản phẩm từ link Shopee — ẩn mặc định, vào sửa từng cái để thêm ảnh & chỉnh giá</p>
              </div>
              {!importing && <button onClick={() => setShowImport(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 20 }}>×</button>}
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Danh mục" required>
                <select value={importCat} onChange={e => setImportCat(e.target.value)} style={inputStyle}>
                  <option value="">-- Chọn danh mục --</option>
                  {flatTreeOptions(categories).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Danh sách link Shopee (mỗi link 1 dòng)">
                <textarea value={importLinks} onChange={e => setImportLinks(e.target.value)}
                  placeholder={"https://shopee.vn/san-pham-1-i.123.456\nhttps://shopee.vn/san-pham-2-i.789.012"}
                  rows={8} disabled={importing}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }} />
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                  {importLinks.split('\n').filter(l => l.trim().includes('shopee')).length} link hợp lệ
                </div>
              </Field>

              {/* Ghi chú */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#92400e' }}>
                <b>⚡ Import nhanh:</b> Tên lấy từ URL, giá mặc định 99.000đ, ẩn trên trang chủ. Sau đó vào từng sản phẩm để sửa giá thực + thêm ảnh.
              </div>

              {/* Log */}
              {importLog.length > 0 && (
                <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '12px 16px', maxHeight: 200, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12 }}>
                  {importLog.map((log, i) => (
                    <div key={i} style={{ color: log.status === 'ok' ? '#4ade80' : log.status === 'err' ? '#f87171' : log.status === 'done' ? '#fbbf24' : '#94a3b8', marginBottom: 3 }}>
                      {log.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: '16px 28px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {!importing && <button onClick={() => setShowImport(false)} style={{ padding: '10px 24px', border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: 'white', fontWeight: 600, fontSize: 14, color: '#374151' }}>Đóng</button>}
              <button onClick={handleImport} disabled={importing} style={{ padding: '10px 32px', background: importing ? '#9ca3af' : '#7c3aed', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: importing ? 'not-allowed' : 'pointer', minWidth: 140 }}>
                {importing ? '⏳ Đang import...' : '🚀 Bắt đầu import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Thêm/Sửa ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1, borderRadius: '16px 16px 0 0' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{form.id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Điền đầy đủ thông tin sản phẩm bên dưới</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 20, color: '#374151' }}>×</button>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* SCRAPE BOX */}
              <div style={{ background: '#fff8f0', borderRadius: 10, padding: '18px 20px', border: '1.5px solid #fcd9c4' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#c2410c', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🪄 Tự động điền từ link Shopee</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} placeholder="Paste link Shopee vào đây..." style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={handleScrape} disabled={scraping} style={{ background: scraping ? '#fed7aa' : '#ee4d2d', color: 'white', border: 'none', borderRadius: 8, padding: '0 18px', fontWeight: 700, fontSize: 13, cursor: scraping ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                    {scraping ? '⏳...' : '🔍 Lấy info'}
                  </button>
                  <button onClick={handleFetchImages} disabled={fetchingImages} style={{ background: fetchingImages ? '#ddd' : '#fff0ee', color: '#ee4d2d', border: '1.5px solid #ee4d2d', borderRadius: 8, padding: '0 14px', fontWeight: 700, fontSize: 13, cursor: fetchingImages ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                    {fetchingImages ? '⏳...' : '🖼️ Lấy ảnh'}
                  </button>
                </div>
                {scrapeMsg && <div style={{ marginTop: 8, fontSize: 13, color: scrapeMsg.startsWith('✅') ? '#065f46' : scrapeMsg.startsWith('⏳') ? '#92400e' : '#991b1b', fontWeight: 500 }}>{scrapeMsg}</div>}
                <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af' }}>1. Paste link → 🔍 Lấy info | 2. 🖼️ Lấy ảnh → tự điền URLs</div>
              </div>

              {/* Thông tin cơ bản */}
              <div style={{ background: '#fafafa', borderRadius: 10, padding: '18px 20px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Thông tin cơ bản</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Tên sản phẩm" required>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Tai nghe Bluetooth Sony WH-1000XM5" style={inputStyle} />
                  </Field>
                  <Field label="Mô tả">
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả nổi bật của sản phẩm..." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                  </Field>
                  <Field label="Danh mục" required>
                    <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} style={inputStyle}>
                      <option value="">-- Chọn danh mục --</option>
                      {flatTreeOptions(categories).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Giá */}
              <div style={{ background: '#fafafa', borderRadius: 10, padding: '18px 20px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Giá bán</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Giá hiện tại" required>
                    <div style={{ position: 'relative' }}>
                      <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="119000" style={{ ...inputStyle, paddingRight: 36 }} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}>đ</span>
                    </div>
                    {form.price && <div style={{ fontSize: 11, color: '#ee4d2d', marginTop: 3 }}>{Number(form.price).toLocaleString('vi-VN')}đ</div>}
                  </Field>
                  <Field label="Giá cũ (gạch ngang)">
                    <div style={{ position: 'relative' }}>
                      <input type="number" value={form.oldPrice} onChange={e => setForm(f => ({ ...f, oldPrice: e.target.value }))} placeholder="189000" style={{ ...inputStyle, paddingRight: 36 }} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}>đ</span>
                    </div>
                    {form.price && form.oldPrice && Number(form.oldPrice) > Number(form.price) && (
                      <div style={{ fontSize: 11, color: '#059669', marginTop: 3 }}>Giảm {Math.round((1 - Number(form.price) / Number(form.oldPrice)) * 100)}%</div>
                    )}
                  </Field>
                </div>
              </div>

              {/* Hình ảnh & Link */}
              <div style={{ background: '#fafafa', borderRadius: 10, padding: '18px 20px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hình ảnh & Liên kết</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Link ảnh (mỗi link 1 dòng)">
                    <textarea value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                      placeholder={"https://down-vn.img.susercontent.com/file/abc123\nhttps://down-vn.img.susercontent.com/file/def456"}
                      rows={5} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6 }} />
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Mỗi URL 1 dòng — ảnh đầu tiên là ảnh đại diện</div>
                    {form.imageUrl && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {form.imageUrl.split('\n').map(u => u.trim()).filter(Boolean).map((url, i) => (
                          <img key={i} src={url} alt={`preview ${i+1}`}
                            style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 6, border: i === 0 ? '2px solid #ee4d2d' : '1px solid #e5e7eb', background: '#fafafa', padding: 2 }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        ))}
                      </div>
                    )}
                  </Field>
                  <Field label="Link affiliate Shopee" required>
                    <input value={form.affLink} onChange={e => setForm(f => ({ ...f, affLink: e.target.value }))} placeholder="https://shope.ee/..." style={inputStyle} />
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Lấy link từ Shopee Affiliate Center</div>
                  </Field>
                </div>
              </div>

              {/* Trạng thái */}
              <div style={{ background: '#fafafa', borderRadius: 10, padding: '16px 20px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Hiển thị sản phẩm</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Sản phẩm sẽ {form.isActive ? 'xuất hiện' : 'bị ẩn'} trên trang chủ</div>
                </div>
                <div onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  style={{ width: 48, height: 26, borderRadius: 13, cursor: 'pointer', background: form.isActive ? '#ee4d2d' : '#d1d5db', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: form.isActive ? 25 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 28px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10, justifyContent: 'flex-end', position: 'sticky', bottom: 0, background: 'white', borderRadius: '0 0 16px 16px' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 24px', border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: 'white', fontWeight: 600, fontSize: 14, color: '#374151' }}>Hủy</button>
              <button onClick={save} disabled={loading} style={{ padding: '10px 32px', background: loading ? '#f87171' : '#ee4d2d', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', minWidth: 120 }}>
                {loading ? 'Đang lưu...' : form.id ? 'Cập nhật' : 'Thêm sản phẩm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
