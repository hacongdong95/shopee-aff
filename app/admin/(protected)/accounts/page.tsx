'use client'

import { useEffect, useState } from 'react'

type Admin = { id: number; email: string; name: string | null; role: string; createdAt: string }

const empty = { email: '', password: '', name: '', role: 'admin' }
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb',
  borderRadius: 8, fontSize: 14, outline: 'none', background: 'white', boxSizing: 'border-box',
}

export default function AccountsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [form, setForm] = useState<typeof empty & { id?: number }>(empty)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const res = await fetch('/api/accounts')
    setAdmins(await res.json())
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setForm(empty); setError(''); setShowForm(true) }
  const openEdit = (a: Admin) => {
    setForm({ id: a.id, email: a.email, password: '', name: a.name || '', role: a.role })
    setError('')
    setShowForm(true)
  }

  const save = async () => {
    if (!form.email) { setError('Vui lòng nhập email'); return }
    if (!form.id && !form.password) { setError('Vui lòng nhập mật khẩu'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/accounts', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Lỗi không xác định'); return }
    setShowForm(false)
    load()
  }

  const del = async (id: number, email: string) => {
    if (!confirm(`Xóa tài khoản "${email}"?`)) return
    await fetch('/api/accounts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  const roleColor = (role: string) => role === 'superadmin'
    ? { bg: '#ede9fe', color: '#6d28d9' }
    : { bg: '#d1fae5', color: '#065f46' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Quản lý tài khoản</h2>
          <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: 13 }}>{admins.length} tài khoản admin</p>
        </div>
        <button onClick={openNew} style={{ background: '#ee4d2d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          + Thêm tài khoản
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '2px solid #f0f0f0' }}>
              <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: 600, color: '#374151' }}>Tên</th>
              <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: 600, color: '#374151' }}>Email</th>
              <th style={{ textAlign: 'center', padding: '14px 20px', fontWeight: 600, color: '#374151' }}>Phân quyền</th>
              <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: 600, color: '#374151' }}>Ngày tạo</th>
              <th style={{ textAlign: 'center', padding: '14px 20px', fontWeight: 600, color: '#374151' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(a => {
              const rc = roleColor(a.role)
              return (
                <tr key={a.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                    {a.name || <span style={{ color: '#9ca3af', fontWeight: 400 }}>Chưa đặt tên</span>}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#555' }}>{a.email}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={{ background: rc.bg, color: rc.color, fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
                      {a.role === 'superadmin' ? '👑 Super Admin' : '🛡️ Admin'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#888', fontSize: 13 }}>
                    {new Date(a.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <button onClick={() => openEdit(a)} style={{ marginRight: 8, color: '#ee4d2d', background: 'none', border: '1px solid #ee4d2d', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Sửa</button>
                    <button onClick={() => del(a.id, a.email)} style={{ color: '#dc2626', background: 'none', border: '1px solid #dc2626', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Xóa</button>
                  </td>
                </tr>
              )
            })}
            {admins.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Chưa có tài khoản</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                {form.id ? '✏️ Sửa tài khoản' : '➕ Thêm tài khoản mới'}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && (
                <div style={{ background: '#fff0ee', border: '1px solid #ffd5cb', borderRadius: 8, padding: '10px 14px', color: '#ee4d2d', fontSize: 13 }}>
                  ⚠️ {error}
                </div>
              )}

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Tên hiển thị</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Nguyễn Văn A" style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email <span style={{ color: '#ee4d2d' }}>*</span></label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@example.com" style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Mật khẩu {form.id && <span style={{ color: '#9ca3af', fontWeight: 400 }}>(để trống nếu không đổi)</span>}
                  {!form.id && <span style={{ color: '#ee4d2d' }}>*</span>}
                </label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Phân quyền</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inputStyle}>
                  <option value="admin">🛡️ Admin — Quản lý sản phẩm, danh mục</option>
                  <option value="superadmin">👑 Super Admin — Toàn quyền</option>
                </select>
              </div>
            </div>

            <div style={{ padding: '16px 28px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 24px', border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: 'white', fontWeight: 600, fontSize: 14, color: '#374151' }}>Hủy</button>
              <button onClick={save} disabled={loading} style={{ padding: '10px 32px', background: loading ? '#f87171' : '#ee4d2d', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', minWidth: 120 }}>
                {loading ? 'Đang lưu...' : form.id ? '💾 Cập nhật' : '✓ Tạo tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
