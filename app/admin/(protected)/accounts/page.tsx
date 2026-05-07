'use client'

import { useEffect, useState } from 'react'

type Category = { id: number; name: string }
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<typeof empty & { id?: number }>(empty)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [deleting, setDeleting] = useState(false)

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

  const openNew = () => { setForm(empty); setShowForm(true) }
  const openEdit = (p: Product) => {
    setForm({
      id: p.id, name: p.name, description: p.description || '',
      price: String(p.price), oldPrice: p.oldPrice ? String(p.oldPrice) : '',
      imageUrl: p.imageUrl || '', affLink: p.affLink,
      categoryId: String(p.categoryId), isActive: p.isActive,
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name || !form.price || !form.affLink || !form.categoryId) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc!')
      return
    }
    setLoading(true)
    const method = form.id ? 'PUT' : 'POST'
    const url = form.id ? `/api/products/${form.id}` : '/api/products'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    setShowForm(false)
    load()
  }

  const del = async (id: number) => {
    if (!confirm('Xóa sản phẩm này?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    load()
  }

  // ─── Xóa nhiều ───────────────────────────────────────────────────────────────
  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(p => p.id)))
    }
  }

  const deleteSelected = async () => {
    if (selected.size === 0) return
    if (!confirm(`Xóa ${selected.size} sản phẩm đã chọn?`)) return
    setDeleting(true)
    await Promise.all([...selected].map(id =>
      fetch(`/api/products/${id}`, { method: 'DELETE' })
    ))
    setDeleting(false)
    load()
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const allSelected = filtered.length > 0 && selected.size === filtered.length
  const someSelected = selected.size > 0

  const disc = (price: number, old: number | null) =>
    old && old > price ? Math.round((1 - price / old) * 100) : null

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Quản lý sản phẩm</h2>
          <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: 13 }}>{products.length} sản phẩm tổng cộng</p>
        </div>
        <button onClick={openNew} style={{
          background: '#ee4d2d', color: 'white', border: 'none',
          padding: '10px 20px', borderRadius: 8, fontWeight: 700,
          fontSize: 14, cursor: 'pointer',
        }}>+ Thêm sản phẩm</button>
      </div>

      {/* Search + toolbar */}
      <div style={{ background: 'white', borderRadius: 10, padding: '10px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Checkbox chọn tất cả */}
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#ee4d2d' }}
          title="Chọn tất cả"
        />
        <span style={{ color: '#9ca3af' }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm sản phẩm..."
          style={{ border: 'none', outline: 'none', fontSize: 14, flex: 1, background: 'transparent', minWidth: 150 }}
        />
        {/* Nút xóa nhiều */}
        {someSelected && (
          <button
            onClick={deleteSelected}
            disabled={deleting}
            style={{
              background: deleting ? '#fca5a5' : '#ef4444',
              color: 'white', border: 'none',
              padding: '7px 16px', borderRadius: 8,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            🗑️ Xóa {selected.size} mục {deleting ? '...' : ''}
          </button>
        )}
        {someSelected && (
          <button
            onClick={() => setSelected(new Set())}
            style={{ background: 'white', border: '1.5px solid #e5e7eb', color: '#6b7280', padding: '7px 14px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            Bỏ chọn
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, padding: 60, textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p>Chưa có sản phẩm nào</p>
          <button onClick={openNew} style={{ background: '#ee4d2d', color: 'white', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>+ Thêm ngay</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>
          {filtered.map(p => {
            const isSelected = selected.has(p.id)
            return (
              <div key={p.id} style={{
                background: 'white', borderRadius: 12,
                boxShadow: isSelected
                  ? '0 0 0 2px #ee4d2d, 0 1px 4px rgba(0,0,0,0.08)'
                  : '0 1px 4px rgba(0,0,0,0.08)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                transition: 'box-shadow 0.15s',
                position: 'relative',
              }}>
                {/* Checkbox góc trên trái */}
                <div
                  onClick={() => toggleSelect(p.id)}
                  style={{
                    position: 'absolute', top: 8, left: 8, zIndex: 10,
                    width: 22, height: 22, borderRadius: 6,
                    background: isSelected ? '#ee4d2d' : 'rgba(255,255,255,0.9)',
                    border: isSelected ? '2px solid #ee4d2d' : '2px solid #d1d5db',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    transition: 'all 0.15s',
                  }}
                >
                  {isSelected && <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>✓</span>}
                </div>

                <div style={{ position: 'relative', paddingTop: '100%', background: '#f5f5f5' }}>
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
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
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ color: '#ee4d2d', fontWeight: 700, fontSize: 16 }}>{p.price.toLocaleString('vi-VN')}đ</span>
                    {p.oldPrice && <span style={{ color: '#9ca3af', fontSize: 12, textDecoration: 'line-through' }}>{p.oldPrice.toLocaleString('vi-VN')}đ</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>👆 {p.clicks} lượt click</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => openEdit(p)} style={{ flex: 1, padding: '7px', border: '1.5px solid #ee4d2d', borderRadius: 7, color: '#ee4d2d', background: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Sửa</button>
                    <button onClick={() => del(p.id)} style={{ flex: 1, padding: '7px', border: '1.5px solid #e5e7eb', borderRadius: 7, color: '#6b7280', background: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Xóa</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
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
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

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

              <div style={{ background: '#fafafa', borderRadius: 10, padding: '18px 20px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hình ảnh & Liên kết</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Link ảnh sản phẩm">
                    <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." style={inputStyle} />
                    {form.imageUrl && (
                      <img src={form.imageUrl} alt="preview" style={{ marginTop: 8, width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    )}
                  </Field>
                  <Field label="Link affiliate Shopee" required>
                    <input value={form.affLink} onChange={e => setForm(f => ({ ...f, affLink: e.target.value }))} placeholder="https://shope.ee/..." style={inputStyle} />
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Lấy link từ Shopee Affiliate Center</div>
                  </Field>
                </div>
              </div>

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
