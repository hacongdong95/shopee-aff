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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<typeof empty & { id?: number }>(empty)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const [p, c] = await Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ])
    setProducts(p)
    setCategories(c)
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

  const field = (label: string, key: keyof typeof empty, type = 'text', required = false) => (
    <div key={key}>
      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </label>
      <input
        type={type}
        value={String(form[key])}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{
          width: '100%', padding: '8px 12px', border: '1px solid var(--border)',
          borderRadius: 6, fontSize: 14,
        }}
      />
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Sản phẩm ({products.length})</h2>
        <button className="btn-primary" onClick={openNew}>+ Thêm sản phẩm</button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 520, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>{form.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {field('Tên sản phẩm', 'name', 'text', true)}
              {field('Mô tả', 'description')}
              {field('Giá (VNĐ)', 'price', 'number', true)}
              {field('Giá cũ (VNĐ)', 'oldPrice', 'number')}
              {field('Link ảnh', 'imageUrl')}
              {field('Link affiliate Shopee', 'affLink', 'text', true)}

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Danh mục <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={form.categoryId}
                  onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  style={{
                    width: '100%', padding: '8px 12px', border: '1px solid var(--border)',
                    borderRadius: 6, fontSize: 14,
                  }}
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                />
                Hiển thị sản phẩm
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                className="btn-primary"
                onClick={save}
                disabled={loading}
                style={{ flex: 1, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  flex: 1, padding: '10px', border: '1px solid var(--border)',
                  borderRadius: 8, cursor: 'pointer', background: 'white',
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', background: '#fafafa' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Sản phẩm</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Danh mục</th>
              <th style={{ textAlign: 'right', padding: '12px 16px' }}>Giá</th>
              <th style={{ textAlign: 'center', padding: '12px 16px' }}>Clicks</th>
              <th style={{ textAlign: 'center', padding: '12px 16px' }}>Trạng thái</th>
              <th style={{ textAlign: 'center', padding: '12px 16px' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, maxWidth: 260 }}>{p.name}</div>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{p.category.name}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--shopee)', fontWeight: 700 }}>
                  {p.price.toLocaleString('vi-VN')}đ
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center', color: '#7c3aed', fontWeight: 700 }}>{p.clicks}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                    background: p.isActive ? '#d1fae5' : '#fee2e2',
                    color: p.isActive ? '#065f46' : '#991b1b',
                  }}>
                    {p.isActive ? 'Hiện' : 'Ẩn'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => openEdit(p)}
                    style={{ marginRight: 8, color: 'var(--shopee)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >Sửa</button>
                  <button
                    onClick={() => del(p.id)}
                    style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >Xóa</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                Chưa có sản phẩm. Nhấn "+ Thêm sản phẩm" để bắt đầu.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
