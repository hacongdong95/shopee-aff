'use client'

import { useEffect, useState } from 'react'

type Category = { id: number; name: string; slug: string; _count?: { products: number } }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const res = await fetch('/api/categories')
    setCategories(await res.json())
  }

  useEffect(() => { load() }, [])

  const add = async () => {
    if (!name.trim()) return
    setLoading(true)
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setName('')
    setLoading(false)
    load()
  }

  const del = async (id: number) => {
    if (!confirm('Xóa danh mục này? Sản phẩm trong danh mục sẽ bị ảnh hưởng.')) return
    await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Danh mục</h2>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, marginBottom: 14 }}>Thêm danh mục mới</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Tên danh mục (vd: Điện tử)"
            style={{
              flex: 1, padding: '10px 14px', border: '1px solid var(--border)',
              borderRadius: 8, fontSize: 14,
            }}
          />
          <button
            className="btn-primary"
            onClick={add}
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '...' : 'Thêm'}
          </button>
        </div>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', background: '#fafafa' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Tên</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Slug</th>
              <th style={{ textAlign: 'center', padding: '12px 16px' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{c.name}</td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)', fontFamily: 'monospace' }}>{c.slug}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => del(c.id)}
                    style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                Chưa có danh mục nào.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
