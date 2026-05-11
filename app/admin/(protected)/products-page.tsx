'use client'

import { useEffect, useState } from 'react'

type Category = { id: number; name: string }
type Product = {
  id: number; name: string; price: number; oldPrice: number | null
  imageUrl: string | null; affLink: string; isActive: boolean
  clicks: number; category: Category; categoryId: number
  description: string | null
}

const DRAFT_KEY = 'admin_product_draft'

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
  const [scrapeUrl, setScrapeUrl] = useState('')
  const [scrapeLoading, setScrapeLoading] = useState(false)
  const [imgLoading, setImgLoading] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)

  const load = async () => {
    const [p, c] = await Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ])
    setProducts(p)
    setCategories(c)
  }

  useEffect(() => {
    load()
    // Kiá»ƒm tra cÃ³ draft khÃ´ng
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) setHasDraft(true)
  }, [])

  // Tá»± Ä‘á»™ng lÆ°u draft má»—i khi form thay Ä‘á»•i
  useEffect(() => {
    if (showForm) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
    }
  }, [form, showForm])

  const openNew = () => {
    // Kiá»ƒm tra cÃ³ draft cÅ© khÃ´ng
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        if (!parsed.id && parsed.name) {
          if (confirm('Ban co draft chua luu. Tiep tuc chinh sua?')) {
            setForm(parsed)
            setShowForm(true)
            return
          }
        }
      } catch {}
    }
    setForm(empty)
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setForm({
      id: p.id, name: p.name, description: p.description || '',
      price: String(p.price), oldPrice: p.oldPrice ? String(p.oldPrice) : '',
      imageUrl: p.imageUrl || '', affLink: p.affLink,
      categoryId: String(p.categoryId), isActive: p.isActive,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    // Xoa draft khi dong bang X hoac Huy
    localStorage.removeItem(DRAFT_KEY)
    setHasDraft(false)
  }

  const save = async () => {
    if (!form.name || !form.price || !form.affLink || !form.categoryId) {
      alert('Vui long dien day du cac truong bat buoc!')
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
    localStorage.removeItem(DRAFT_KEY)
    setHasDraft(false)
    load()
  }

  const del = async (id: number) => {
    if (!confirm('Xoa san pham nay?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    load()
  }

  const scrape = async () => {
    if (!scrapeUrl) return
    setScrapeLoading(true)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl }),
      })
      const d = await res.json()
      if (d.ok) {
        setForm(f => ({
          ...f,
          name: d.name || f.name,
          price: d.price ? String(d.price) : f.price,
          oldPrice: d.oldPrice ? String(d.oldPrice) : f.oldPrice,
          description: d.description || f.description,
          affLink: f.affLink || scrapeUrl,
        }))
      } else {
        alert('Loi lay info: ' + d.error)
      }
    } catch { alert('Loi ket noi') }
    setScrapeLoading(false)
  }

  const fetchImages = async () => {
    if (!scrapeUrl) return
    setImgLoading(true)
    try {
      const res = await fetch('/api/shopee-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl }),
      })
      const d = await res.json()
      if (d.imageUrls?.length) {
        setForm(f => ({ ...f, imageUrl: d.imageUrls.join('\n') }))
      } else {
        alert('Khong lay duoc anh: ' + (d.error || 'Thu them anh thu cong'))
      }
    } catch { alert('Loi ket noi') }
    setImgLoading(false)
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const disc = (price: number, old: number | null) =>
    old && old > price ? Math.round((1 - price / old) * 100) : null

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Quan ly san pham</h2>
          <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: 13 }}>{products.length} san pham tong cong</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {hasDraft && (
            <span style={{ fontSize: 12, color: '#b45309', background: '#fef9c3', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
              Co draft chua luu
            </span>
          )}
          <button onClick={openNew} style={{
            background: '#ee4d2d', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: 8, fontWeight: 700,
            fontSize: 14, cursor: 'pointer',
          }}>+ Them san pham</button>
        </div>
      </div>

      {/* Search */}
      <div style={{
        background: 'white', borderRadius: 10, padding: '10px 16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ color: '#9ca3af' }}>ðŸ”</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tim kiem san pham..."
          style={{ border: 'none', outline: 'none', fontSize: 14, flex: 1, background: 'transparent' }}
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, padding: 60, textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>ðŸ“¦</div>
          <p>Chua co san pham nao</p>
          <button onClick={openNew} style={{ background: '#ee4d2d', color: 'white', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>+ Them ngay</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', paddingTop: '100%', background: '#f5f5f5' }}>
                {p.imageUrl
                  ? <img src={p.imageUrl.split('\n')[0]} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#d1d5db' }}>ðŸ›ï¸</div>
                }
                {disc(p.price, p.oldPrice) && (
                  <div style={{ position: 'absolute', top: 8, left: 8, background: '#ee4d2d', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>-{disc(p.price, p.oldPrice)}%</div>
                )}
                <div style={{ position: 'absolute', top: 8, right: 8, background: p.isActive ? '#d1fae5' : '#fee2e2', color: p.isActive ? '#065f46' : '#991b1b', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                  {p.isActive ? 'Hien' : 'An'}
                </div>
              </div>
              <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#ee4d2d', fontWeight: 600 }}>{p.category.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ color: '#ee4d2d', fontWeight: 700, fontSize: 16 }}>{p.price.toLocaleString('vi-VN')}d</span>
                  {p.oldPrice && <span style={{ color: '#9ca3af', fontSize: 12, textDecoration: 'line-through' }}>{p.oldPrice.toLocaleString('vi-VN')}d</span>}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>ðŸ‘† {p.clicks} luot click</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={() => openEdit(p)} style={{ flex: 1, padding: '7px', border: '1.5px solid #ee4d2d', borderRadius: 7, color: '#ee4d2d', background: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Sua</button>
                  <button onClick={() => del(p.id)} style={{ flex: 1, padding: '7px', border: '1.5px solid #e5e7eb', borderRadius: 7, color: '#6b7280', background: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Xoa</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal â€” overlay khong co onClick, chi dong bang nut X hoac Huy */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div
            style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}
          >

            {/* Header */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1, borderRadius: '16px 16px 0 0' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{form.id ? 'Chinh sua san pham' : 'Them san pham moi'}</h3>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Chi dong form bang nut X hoac Huy</p>
              </div>
              <button onClick={closeForm} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 20, color: '#374151' }}>Ã—</button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Scrape section */}
              {!form.id && (
                <div style={{ background: '#fff7f0', borderRadius: 10, padding: '16px 20px', border: '1.5px solid #fed7aa' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    âš¡ Tu dong dien tu link Shopee
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      value={scrapeUrl}
                      onChange={e => setScrapeUrl(e.target.value)}
                      placeholder="Paste link Shopee vao day..."
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={scrape} disabled={scrapeLoading || !scrapeUrl}
                      style={{ flex: 1, padding: '8px 0', background: scrapeLoading ? '#fca5a5' : '#ee4d2d', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: scrapeLoading ? 'not-allowed' : 'pointer' }}>
                      {scrapeLoading ? 'Dang lay...' : 'ðŸ” Lay info'}
                    </button>
                    <button onClick={fetchImages} disabled={imgLoading || !scrapeUrl}
                      style={{ flex: 1, padding: '8px 0', background: imgLoading ? '#bfdbfe' : '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: imgLoading ? 'not-allowed' : 'pointer' }}>
                      {imgLoading ? 'Dang lay...' : 'ðŸ–¼ï¸ Lay anh'}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: '#9a3412', marginTop: 8 }}>
                    1. Paste link â†’ Lay info â†’ dien ten/gia/mo ta &nbsp;|&nbsp; 2. Lay anh â†’ tu dien URLs anh
                  </div>
                </div>
              )}

              {/* Thong tin co ban */}
              <div style={{ background: '#fafafa', borderRadius: 10, padding: '18px 20px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Thong tin co ban</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Ten san pham" required>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Tai nghe Bluetooth Sony WH-1000XM5" style={inputStyle} />
                  </Field>
                  <Field label="Mo ta">
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mo ta noi bat cua san pham..." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                  </Field>
                  <Field label="Danh muc" required>
                    <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} style={inputStyle}>
                      <option value="">-- Chon danh muc --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Gia */}
              <div style={{ background: '#fafafa', borderRadius: 10, padding: '18px 20px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gia ban</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Gia hien tai" required>
                    <div style={{ position: 'relative' }}>
                      <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="119000" style={{ ...inputStyle, paddingRight: 36 }} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}>d</span>
                    </div>
                    {form.price && <div style={{ fontSize: 11, color: '#ee4d2d', marginTop: 3 }}>{Number(form.price).toLocaleString('vi-VN')}d</div>}
                  </Field>
                  <Field label="Gia cu (gach ngang)">
                    <div style={{ position: 'relative' }}>
                      <input type="number" value={form.oldPrice} onChange={e => setForm(f => ({ ...f, oldPrice: e.target.value }))} placeholder="189000" style={{ ...inputStyle, paddingRight: 36 }} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}>d</span>
                    </div>
                    {form.price && form.oldPrice && Number(form.oldPrice) > Number(form.price) && (
                      <div style={{ fontSize: 11, color: '#059669', marginTop: 3 }}>Giam {Math.round((1 - Number(form.price) / Number(form.oldPrice)) * 100)}%</div>
                    )}
                  </Field>
                </div>
              </div>

              {/* Hinh anh & Link */}
              <div style={{ background: '#fafafa', borderRadius: 10, padding: '18px 20px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hinh anh & Lien ket</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Link anh san pham (moi link 1 dong)">
                    <textarea value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder={'https://down-vn.img.susercontent.com/file/abc123\nhttps://down-vn.img.susercontent.com/file/def456'} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
                    {form.imageUrl && (() => {
                      const imgs = form.imageUrl.split('\n').map(u => u.trim()).filter(Boolean)
                      return imgs.length > 0 ? (
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          {imgs.slice(0, 5).map((u, i) => (
                            <img key={i} src={u} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          ))}
                          {imgs.length > 5 && <div style={{ width: 56, height: 56, borderRadius: 6, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#6b7280' }}>+{imgs.length - 5}</div>}
                        </div>
                      ) : null
                    })()}
                  </Field>
                  <Field label="Link affiliate Shopee" required>
                    <input value={form.affLink} onChange={e => setForm(f => ({ ...f, affLink: e.target.value }))} placeholder="https://shope.ee/..." style={inputStyle} />
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Lay link tu Shopee Affiliate Center</div>
                  </Field>
                </div>
              </div>

              {/* Trang thai */}
              <div style={{ background: '#fafafa', borderRadius: 10, padding: '16px 20px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Hien thi san pham</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>San pham se {form.isActive ? 'xuat hien' : 'bi an'} tren trang chu</div>
                </div>
                <div onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  style={{ width: 48, height: 26, borderRadius: 13, cursor: 'pointer', background: form.isActive ? '#ee4d2d' : '#d1d5db', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: form.isActive ? 25 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10, justifyContent: 'flex-end', position: 'sticky', bottom: 0, background: 'white', borderRadius: '0 0 16px 16px' }}>
              <button onClick={closeForm} style={{ padding: '10px 24px', border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: 'white', fontWeight: 600, fontSize: 14, color: '#374151' }}>Huy</button>
              <button onClick={save} disabled={loading} style={{ padding: '10px 32px', background: loading ? '#f87171' : '#ee4d2d', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', minWidth: 120 }}>
                {loading ? 'Dang luu...' : form.id ? 'Cap nhat' : 'Them san pham'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
