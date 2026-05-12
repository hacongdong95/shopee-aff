'use client'

import { useEffect, useRef, useState } from 'react'

type Category = { id: number; name: string; parentId: number | null }
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

const PRIMARY = '#ee4d2d'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
        {label} {required && <span style={{ color: PRIMARY }}>*</span>}
      </label>
      {children}
    </div>
  )
}

// Build cây category cho sidebar
function buildCategoryTree(cats: Category[]) {
  const map: Record<number, Category & { children: Category[] }> = {}
  cats.forEach(c => { map[c.id] = { ...c, children: [] } })
  const roots: (Category & { children: Category[] })[] = []
  cats.forEach(c => {
    if (c.parentId && map[c.parentId]) map[c.parentId].children.push(map[c.id])
    else roots.push(map[c.id])
  })
  return { map, roots }
}

// Flatten cây → options theo đúng thứ tự cha → con
function flatTreeOptions(cats: Category[]): { id: number; name: string; isChild: boolean }[] {
  const map: Record<number, Category & { children: Category[] }> = {}
  cats.forEach(c => { map[c.id] = { ...c, children: [] } })
  const roots: (Category & { children: Category[] })[] = []
  cats.forEach(c => {
    if (c.parentId && map[c.parentId]) map[c.parentId].children.push(map[c.id])
    else roots.push(map[c.id])
  })
  const result: { id: number; name: string; isChild: boolean }[] = []
  const walk = (node: Category & { children: Category[] }) => {
    result.push({ id: node.id, name: node.name, isChild: node.parentId !== null })
    node.children.forEach(walk)
  }
  roots.forEach(walk)
  return result
}

export default function ProductsPage() {
  const [products, setProducts]     = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm]             = useState<typeof empty & { id?: number }>(empty)
  const draftForm = useRef<typeof empty & { id?: number }>(empty)
  const setFormWithDraft = (updater: typeof empty & { id?: number } | ((prev: typeof empty & { id?: number }) => typeof empty & { id?: number })) => {
    setForm(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      draftForm.current = next
      return next
    })
  }
  const [showForm, setShowForm]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<Set<number>>(new Set())
  const [deleting, setDeleting]     = useState(false)

  // Filter category (sidebar tree)
  const [filterCat, setFilterCat]   = useState<number | null>(null)

  // Bulk move modal
  const [showBulkMove, setShowBulkMove] = useState(false)
  const [moveToCat, setMoveToCat]       = useState('')
  const [moving, setMoving]             = useState(false)

  // Quick edit
  const [quickEdit, setQuickEdit]   = useState<{ id: number; price: string; oldPrice: string } | null>(null)

  // Import
  const [showImport, setShowImport] = useState(false)
  const [importLinks, setImportLinks] = useState('')
  const [importCat, setImportCat]   = useState('')
  const [importing, setImporting]   = useState(false)
  const [importLog, setImportLog]   = useState<string[]>([])

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
  }

  useEffect(() => { load() }, [])

  const openNew  = () => { draftForm.current = empty; setForm(empty); setScrapeUrl(''); setScrapeMsg(''); setShowForm(true) }
  const openEdit = (p: Product) => {
    const data = { id: p.id, name: p.name, description: p.description || '', price: String(p.price), oldPrice: p.oldPrice ? String(p.oldPrice) : '', imageUrl: p.imageUrl || '', affLink: p.affLink, categoryId: String(p.categoryId), isActive: p.isActive }
    // Nếu đang có draft của đúng sản phẩm này thì khôi phục draft
    const draft = draftForm.current
    const restored = draft.id === p.id ? draft : data
    draftForm.current = restored
    setForm(restored)
    setScrapeUrl(''); setScrapeMsg(''); setShowForm(true)
  }

  const duplicate = async (p: Product) => {
    if (!confirm(`Nhân bản "${p.name}"?`)) return
    await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: p.name + ' (copy)', description: p.description, price: p.price, oldPrice: p.oldPrice, imageUrl: p.imageUrl, affLink: p.affLink, categoryId: p.categoryId, isActive: false }) })
    load()
  }

  const saveQuickEdit = async () => {
    if (!quickEdit) return
    await fetch(`/api/products/${quickEdit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price: Number(quickEdit.price), oldPrice: quickEdit.oldPrice ? Number(quickEdit.oldPrice) : null }) })
    setQuickEdit(null); load()
  }

  const bulkToggle = async (active: boolean) => {
    if (selected.size === 0) return
    await Promise.all([...selected].map(id => fetch(`/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: active }) })))
    load()
  }

  // ── Bulk move category ────────────────────────────────────────────────────
  const bulkMove = async () => {
    if (!moveToCat || selected.size === 0) return
    setMoving(true)
    await Promise.all([...selected].map(id =>
      fetch(`/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categoryId: Number(moveToCat) }) })
    ))
    setMoving(false); setShowBulkMove(false); setMoveToCat(''); load()
  }

  const handleImport = async () => {
    const links = importLinks.split('\n').map(l => l.trim()).filter(l => l.includes('shopee'))
    if (links.length === 0) { alert('Không tìm thấy link Shopee hợp lệ!'); return }
    if (!importCat) { alert('Chọn danh mục trước!'); return }
    setImporting(true); setImportLog([`🚀 Bắt đầu import ${links.length} sản phẩm...`])
    for (let i = 0; i < links.length; i++) {
      const url = links[i]
      setImportLog(prev => [...prev, `⏳ [${i+1}/${links.length}] Đang xử lý...`])
      try {
        const res  = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
        const data = await res.json()
        if (!res.ok || data.error) { setImportLog(prev => [...prev.slice(0,-1), `❌ [${i+1}/${links.length}] ${data.error || 'Scrape thất bại'}`]); continue }
        await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: data.name, description: data.description, price: data.price, oldPrice: data.oldPrice, imageUrl: null, affLink: url, categoryId: Number(importCat), isActive: true }) })
        setImportLog(prev => [...prev.slice(0,-1), `✅ [${i+1}/${links.length}] ${data.name}`])
      } catch (e) { setImportLog(prev => [...prev.slice(0,-1), `❌ [${i+1}/${links.length}] Lỗi: ${e}`]) }
      if (i < links.length - 1) await new Promise(r => setTimeout(r, 1500))
    }
    setImportLog(prev => [...prev, '🎉 Hoàn tất!']); setImporting(false); load()
  }

  const handleScrape = async () => {
    if (!scrapeUrl.includes('shopee')) { setScrapeMsg('❌ Vui lòng nhập link Shopee hợp lệ'); return }
    setScraping(true); setScrapeMsg('⏳ Đang lấy thông tin...')
    try {
      const res  = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: scrapeUrl }) })
      const data = await res.json()
      if (!res.ok || data.error) { setScrapeMsg(`❌ ${data.error || 'Scrape thất bại'}`); return }
      setForm(f => ({ ...f, name: data.name || f.name, description: data.description || f.description, price: data.price ? String(data.price) : f.price, oldPrice: data.oldPrice ? String(data.oldPrice) : f.oldPrice, affLink: scrapeUrl }))
      setScrapeMsg('✅ Đã điền thông tin! Kiểm tra lại giá và bấm "Lấy ảnh" nhé.')
    } catch (e) { setScrapeMsg(`❌ Lỗi: ${e}`) }
    finally { setScraping(false) }
  }

  const handleFetchImages = async () => {
    const shopeeLink = form.affLink || scrapeUrl
    if (!shopeeLink) { setScrapeMsg('❌ Nhập link Shopee vào ô Affiliate trước!'); return }
    setFetchingImages(true); setScrapeMsg('⏳ Đang lấy ảnh...')
    try {
      const res  = await fetch('/api/shopee-images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: shopeeLink }) })
      const data = await res.json()
      if (!res.ok || data.error) { setScrapeMsg(`❌ ${data.error}`); return }
      setForm(f => ({ ...f, imageUrl: data.imageUrls.join('\n') }))
      setScrapeMsg(`✅ Lấy được ${data.count} ảnh!`)
    } catch (e) { setScrapeMsg(`❌ Lỗi: ${e}`) }
    finally { setFetchingImages(false) }
  }

  const save = async () => {
    if (!form.name || !form.price || !form.affLink || !form.categoryId) { alert('Vui lòng điền đầy đủ các trường bắt buộc!'); return }
    setLoading(true)
    try {
      const method = form.id ? 'PUT' : 'POST'
      const url    = form.id ? `/api/products/${form.id}` : '/api/products'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Lỗi không xác định' }))
        alert('Lỗi lưu sản phẩm: ' + (err.error || res.status))
        setLoading(false); return
      }
      setShowForm(false); load()
    } catch (e) {
      alert('Lỗi kết nối: ' + e)
    } finally {
      setLoading(false)
    }
  }

  const del = async (id: number) => {
    if (!confirm('Xóa sản phẩm này?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' }); load()
  }

  const toggleSelect  = (id: number) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const deleteSelected = async () => {
    if (!confirm(`Xóa ${selected.size} sản phẩm đã chọn?`)) return
    setDeleting(true)
    await Promise.all([...selected].map(id => fetch(`/api/products/${id}`, { method: 'DELETE' })))
    setDeleting(false); load()
  }

  // Filter theo search + category sidebar
  const getDescendantIds = (catId: number): number[] => {
    const children = categories.filter(c => c.parentId === catId)
    return [catId, ...children.flatMap(c => getDescendantIds(c.id))]
  }

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = filterCat === null || getDescendantIds(filterCat).includes(p.categoryId)
    return matchSearch && matchCat
  })

  const allSelected  = filtered.length > 0 && filtered.every(p => selected.has(p.id))
  const someSelected = selected.size > 0
  const toggleAll    = () => {
    if (allSelected) setSelected(prev => { const n = new Set(prev); filtered.forEach(p => n.delete(p.id)); return n })
    else setSelected(prev => { const n = new Set(prev); filtered.forEach(p => n.add(p.id)); return n })
  }

  const disc = (price: number, old: number | null) => old && old > price ? Math.round((1 - price / old) * 100) : null

  const { roots: catRoots, map: catMap } = buildCategoryTree(categories)

  // Group count per category (gồm cả con)
  const countInCat = (catId: number) => {
    const ids = getDescendantIds(catId)
    return products.filter(p => ids.includes(p.categoryId)).length
  }

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

      {/* ── Sidebar: Category Tree ── */}
      <div style={{ width: 220, flexShrink: 0, background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', position: 'sticky', top: 80 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5', fontSize: 13, fontWeight: 700, color: '#374151', background: '#fafafa' }}>
          🗂️ Lọc theo danh mục
        </div>
        {/* Tất cả */}
        <div onClick={() => setFilterCat(null)}
          style={{ padding: '9px 16px', fontSize: 13, cursor: 'pointer', background: filterCat === null ? `${PRIMARY}10` : 'white', color: filterCat === null ? PRIMARY : '#374151', fontWeight: filterCat === null ? 700 : 500, borderLeft: filterCat === null ? `3px solid ${PRIMARY}` : '3px solid transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📦 Tất cả</span>
          <span style={{ fontSize: 11, background: '#f0f0f0', padding: '1px 7px', borderRadius: 10, color: '#666' }}>{products.length}</span>
        </div>
        {/* Cây danh mục */}
        {catRoots.map(root => (
          <div key={root.id}>
            <div onClick={() => setFilterCat(root.id)}
              style={{ padding: '9px 16px', fontSize: 13, cursor: 'pointer', background: filterCat === root.id ? `${PRIMARY}10` : 'white', color: filterCat === root.id ? PRIMARY : '#374151', fontWeight: 700, borderLeft: filterCat === root.id ? `3px solid ${PRIMARY}` : '3px solid transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f5f5f5' }}>
              <span>📁 {root.name}</span>
              <span style={{ fontSize: 11, background: `${PRIMARY}15`, padding: '1px 7px', borderRadius: 10, color: PRIMARY }}>{countInCat(root.id)}</span>
            </div>
            {(root as typeof root & { children: typeof root[] }).children?.map((child: typeof root) => (
              <div key={child.id} onClick={() => setFilterCat(child.id)}
                style={{ padding: '7px 16px 7px 28px', fontSize: 12, cursor: 'pointer', background: filterCat === child.id ? `${PRIMARY}10` : 'white', color: filterCat === child.id ? PRIMARY : '#555', fontWeight: filterCat === child.id ? 700 : 400, borderLeft: filterCat === child.id ? `3px solid ${PRIMARY}` : '3px solid transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>└ {child.name}</span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{countInCat(child.id)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Quản lý sản phẩm</h2>
            <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: 13 }}>
              {filtered.length} / {products.length} sản phẩm
              {filterCat !== null && <span style={{ color: PRIMARY, fontWeight: 600 }}> · {categories.find(c => c.id === filterCat)?.name}</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => { setShowImport(true); setImportLog([]) }} style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              📥 Import hàng loạt
            </button>
            <button onClick={openNew} style={{ background: PRIMARY, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              + Thêm sản phẩm
            </button>
          </div>
        </div>

        {/* Search + select all */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Tìm kiếm sản phẩm..."
            style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none' }} />
          {/* Checkbox chọn tất cả */}
          <div onClick={toggleAll} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '8px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: 'white', userSelect: 'none', fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, border: allSelected ? `2px solid ${PRIMARY}` : '2px solid #d1d5db', background: allSelected ? PRIMARY : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {allSelected && <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>}
              {someSelected && !allSelected && <span style={{ color: PRIMARY, fontSize: 14, lineHeight: 1 }}>−</span>}
            </div>
            {allSelected ? 'Bỏ chọn tất cả' : `Chọn tất cả (${filtered.length})`}
          </div>
        </div>

        {/* ── Bulk action bar ── */}
        {someSelected && (
          <div style={{ background: 'white', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', boxShadow: `0 0 0 2px ${PRIMARY}40, 0 2px 8px rgba(0,0,0,0.08)`, border: `1.5px solid ${PRIMARY}33` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, marginRight: 4 }}>
              ✓ {selected.size} đã chọn
            </span>
            {/* Move to category */}
            <button onClick={() => setShowBulkMove(true)}
              style={{ background: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #bfdbfe', borderRadius: 7, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              📁 Chuyển danh mục
            </button>
            <button onClick={() => bulkToggle(true)}
              style={{ background: '#f0fdf4', color: '#059669', border: '1.5px solid #bbf7d0', borderRadius: 7, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              👁️ Hiện tất cả
            </button>
            <button onClick={() => bulkToggle(false)}
              style={{ background: '#fafafa', color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: 7, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              🙈 Ẩn tất cả
            </button>
            <button onClick={deleteSelected} disabled={deleting}
              style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: 7, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer' }}>
              {deleting ? '⏳ Đang xóa...' : '🗑️ Xóa đã chọn'}
            </button>
            <button onClick={() => setSelected(new Set())}
              style={{ background: 'none', color: '#9ca3af', border: 'none', padding: '6px 10px', fontSize: 13, cursor: 'pointer', marginLeft: 'auto' }}>
              ✕ Bỏ chọn
            </button>
          </div>
        )}

        {/* ── Grid sản phẩm ── */}
        {filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, padding: 60, textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <p>Chưa có sản phẩm nào{filterCat !== null ? ' trong danh mục này' : ''}</p>
            <button onClick={openNew} style={{ background: PRIMARY, color: 'white', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>+ Thêm ngay</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {filtered.map(p => {
              const isSelected  = selected.has(p.id)
              const isQuickEdit = quickEdit?.id === p.id
              return (
                <div key={p.id} style={{ background: 'white', borderRadius: 12, boxShadow: isSelected ? `0 0 0 2px ${PRIMARY}, 0 1px 4px rgba(0,0,0,0.08)` : '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'box-shadow 0.15s' }}>

                  {/* Checkbox */}
                  <div onClick={() => toggleSelect(p.id)} style={{ position: 'absolute', top: 8, left: 8, zIndex: 10, width: 22, height: 22, borderRadius: 6, background: isSelected ? PRIMARY : 'rgba(255,255,255,0.9)', border: isSelected ? `2px solid ${PRIMARY}` : '2px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'all 0.15s' }}>
                    {isSelected && <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>✓</span>}
                  </div>

                  <div style={{ position: 'relative', paddingTop: '100%', background: '#f5f5f5' }}>
                    {p.imageUrl
                      ? <img src={p.imageUrl.split('\n')[0].trim()} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#d1d5db' }}>🛍️</div>
                    }
                    {disc(p.price, p.oldPrice) && (
                      <div style={{ position: 'absolute', top: 8, right: 8, background: PRIMARY, color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>-{disc(p.price, p.oldPrice)}%</div>
                    )}
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: p.isActive ? '#d1fae5' : '#fee2e2', color: p.isActive ? '#065f46' : '#991b1b', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                      {p.isActive ? 'Hiện' : 'Ẩn'}
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: PRIMARY, fontWeight: 600 }}>{p.category.name}</div>

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
                          <span style={{ color: PRIMARY, fontWeight: 700, fontSize: 16 }}>{p.price.toLocaleString('vi-VN')}đ</span>
                          {p.oldPrice && <span style={{ color: '#9ca3af', fontSize: 12, textDecoration: 'line-through' }}>{p.oldPrice.toLocaleString('vi-VN')}đ</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>👆 {p.clicks} lượt click</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          <button onClick={() => openEdit(p)} style={{ flex: 1, padding: '6px', border: `1.5px solid ${PRIMARY}`, borderRadius: 7, color: PRIMARY, background: 'white', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Sửa</button>
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
      </div>

      {/* ── Modal Bulk Move ── */}
      {showBulkMove && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowBulkMove(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>📁 Chuyển danh mục</h3>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>{selected.size} sản phẩm được chọn</p>
              </div>
              <button onClick={() => setShowBulkMove(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Chuyển sang danh mục <span style={{ color: PRIMARY }}>*</span>
              </label>
              <select value={moveToCat} onChange={e => setMoveToCat(e.target.value)}
                style={{ ...inputStyle, fontSize: 14 }}>
                <option value="">-- Chọn danh mục đích --</option>
                {flatTreeOptions(categories).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.isChild ? `  └─ ${c.name}` : `📁 ${c.name}`}
                  </option>
                ))}
              </select>
              {moveToCat && (
                <div style={{ marginTop: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#065f46' }}>
                  ✅ Sẽ chuyển <strong>{selected.size}</strong> sản phẩm → <strong>{categories.find(c => c.id === Number(moveToCat))?.name}</strong>
                </div>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowBulkMove(false)} style={{ padding: '9px 20px', border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: 'white', fontWeight: 600, fontSize: 14, color: '#374151' }}>Hủy</button>
              <button onClick={bulkMove} disabled={moving || !moveToCat}
                style={{ padding: '9px 28px', background: moving ? '#9ca3af' : PRIMARY, color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: moving || !moveToCat ? 'not-allowed' : 'pointer', opacity: !moveToCat ? 0.6 : 1 }}>
                {moving ? '⏳ Đang chuyển...' : '📁 Chuyển ngay'}
              </button>
            </div>
          </div>
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
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Paste nhiều link Shopee, mỗi link 1 dòng</p>
              </div>
              {!importing && <button onClick={() => setShowImport(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 20 }}>×</button>}
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Danh mục" required>
                <select value={importCat} onChange={e => setImportCat(e.target.value)} style={inputStyle}>
                  <option value="">-- Chọn danh mục --</option>
                  {flatTreeOptions(categories).map(c => <option key={c.id} value={c.id}>{c.isChild ? `  └─ ${c.name}` : c.name}</option>)}
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
              {importLog.length > 0 && (
                <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '12px 16px', maxHeight: 200, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12 }}>
                  {importLog.map((log, i) => (
                    <div key={i} style={{ color: log.startsWith('✅') ? '#4ade80' : log.startsWith('❌') ? '#f87171' : log.startsWith('🎉') ? '#fbbf24' : '#94a3b8', marginBottom: 4 }}>{log}</div>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
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
                  <button onClick={handleScrape} disabled={scraping} style={{ background: scraping ? '#fed7aa' : PRIMARY, color: 'white', border: 'none', borderRadius: 8, padding: '0 18px', fontWeight: 700, fontSize: 13, cursor: scraping ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                    {scraping ? '⏳...' : '🔍 Lấy info'}
                  </button>
                  <button onClick={handleFetchImages} disabled={fetchingImages} style={{ background: fetchingImages ? '#ddd' : '#fff0ee', color: PRIMARY, border: `1.5px solid ${PRIMARY}`, borderRadius: 8, padding: '0 14px', fontWeight: 700, fontSize: 13, cursor: fetchingImages ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                    {fetchingImages ? '⏳...' : '🖼️ Lấy ảnh'}
                  </button>
                </div>
                {scrapeMsg && <div style={{ marginTop: 8, fontSize: 13, color: scrapeMsg.startsWith('✅') ? '#065f46' : scrapeMsg.startsWith('⏳') ? '#92400e' : '#991b1b', fontWeight: 500 }}>{scrapeMsg}</div>}
              </div>

              {/* Thông tin cơ bản */}
              <div style={{ background: '#fafafa', borderRadius: 10, padding: '18px 20px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Thông tin cơ bản</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Tên sản phẩm" required>
                    <input value={form.name} onChange={e => setFormWithDraft(f => ({ ...f, name: e.target.value }))} placeholder="VD: Tai nghe Bluetooth Sony WH-1000XM5" style={inputStyle} />
                  </Field>
                  <Field label="Mô tả">
                    <textarea value={form.description} onChange={e => setFormWithDraft(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả nổi bật của sản phẩm..." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                  </Field>
                  <Field label="Danh mục" required>
                    <select value={form.categoryId} onChange={e => setFormWithDraft(f => ({ ...f, categoryId: e.target.value }))} style={inputStyle}>
                      <option value="">-- Chọn danh mục --</option>
                      {flatTreeOptions(categories).map(c => <option key={c.id} value={c.id}>{c.isChild ? `  └─ ${c.name}` : `📁 ${c.name}`}</option>)}
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
                      <input type="number" value={form.price} onChange={e => setFormWithDraft(f => ({ ...f, price: e.target.value }))} placeholder="119000" style={{ ...inputStyle, paddingRight: 36 }} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}>đ</span>
                    </div>
                    {form.price && <div style={{ fontSize: 11, color: PRIMARY, marginTop: 3 }}>{Number(form.price).toLocaleString('vi-VN')}đ</div>}
                  </Field>
                  <Field label="Giá cũ (gạch ngang)">
                    <div style={{ position: 'relative' }}>
                      <input type="number" value={form.oldPrice} onChange={e => setFormWithDraft(f => ({ ...f, oldPrice: e.target.value }))} placeholder="189000" style={{ ...inputStyle, paddingRight: 36 }} />
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
                  <Field label="Link ảnh sản phẩm (mỗi link 1 dòng)">
                    <textarea value={form.imageUrl} onChange={e => setFormWithDraft(f => ({ ...f, imageUrl: e.target.value }))} rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6 }} />
                    {form.imageUrl && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {form.imageUrl.split('\n').map(u => u.trim()).filter(Boolean).map((url, i) => (
                          <img key={i} src={url} alt="" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 6, border: i === 0 ? `2px solid ${PRIMARY}` : '1px solid #e5e7eb', background: '#fafafa', padding: 2 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        ))}
                      </div>
                    )}
                  </Field>
                  <Field label="Link affiliate Shopee" required>
                    <input value={form.affLink} onChange={e => setFormWithDraft(f => ({ ...f, affLink: e.target.value }))} placeholder="https://shope.ee/..." style={inputStyle} />
                  </Field>
                </div>
              </div>

              {/* Trạng thái */}
              <div style={{ background: '#fafafa', borderRadius: 10, padding: '16px 20px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Hiển thị sản phẩm</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Sản phẩm sẽ {form.isActive ? 'xuất hiện' : 'bị ẩn'} trên trang chủ</div>
                </div>
                <div onClick={() => setFormWithDraft(f => ({ ...f, isActive: !f.isActive }))}
                  style={{ width: 48, height: 26, borderRadius: 13, cursor: 'pointer', background: form.isActive ? PRIMARY : '#d1d5db', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: form.isActive ? 25 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 28px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10, justifyContent: 'flex-end', position: 'sticky', bottom: 0, background: 'white', borderRadius: '0 0 16px 16px' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 24px', border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: 'white', fontWeight: 600, fontSize: 14, color: '#374151' }}>Hủy</button>
              <button onClick={save} disabled={loading} style={{ padding: '10px 32px', background: loading ? '#f87171' : PRIMARY, color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', minWidth: 120 }}>
                {loading ? 'Đang lưu...' : form.id ? 'Cập nhật' : 'Thêm sản phẩm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
