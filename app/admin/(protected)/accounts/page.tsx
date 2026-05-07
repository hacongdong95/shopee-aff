'use client'

import { useEffect, useState } from 'react'

type AdminUser = {
  id: number
  email: string
  name: string
  role: 'admin' | 'editor'
  createdAt: string
}

const emptyForm = { email: '', password: '', name: '', role: 'editor' as 'admin' | 'editor' }
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #e5e7eb', borderRadius: 8,
  fontSize: 14, outline: 'none', background: 'white',
  boxSizing: 'border-box',
}

export default function AccountsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [form, setForm] = useState<typeof emptyForm & { id?: number }>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forbidden, setForbidden] = useState(false)

  const load = async () => {
    const res = await fetch('/api/admins')
    if (res.status === 403) { setForbidden(true); return }
    setAdmins(await res.json())
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setForm(emptyForm); setError(''); setShowForm(true) }
  const openEdit = (a: AdminUser) => {
    setForm({ id: a.id, email: a.email, name: a.name, role: a.role, password: '' })
    setError('')
    setShowForm(true)
  }

  const save = async () => {
    if (!form.email) { setError('Vui lòng nhập email'); return }
    if (!form.id && !form.password) { setError('Vui lòng nhập mật khẩu'); return }
    setLoading(true); setError('')
    const method = form.id ? 'PUT' : 'POST'
    const url = form.id ? `/api/admins/${form.id}` : '/api/admins'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Lỗi không xác định'); return }
    setShowForm(false)
    load()
  }

  const del = async (a: AdminUser) => {
    if (!confirm(`Xóa tài khoản "${a.email}"?`)) return
    const res = await fetch(`/api/admins/${a.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { alert(data.error); return }
    load()
  }

  if (forbidden) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <h3 style={{ color: '#374151' }}>Chỉ Admin mới có quyền truy cập</h3>
        <p>Tài khoản Editor không thể quản lý tài khoản khác.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Quản lý tài khoản</h2>
          <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: 13 }}>{admins.length} tài khoản</p>
        </div>
        <button onClick={openNew} style={{ background: '#ee4d2d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          + Thêm tài khoản
        </button>
      </div>

      {/* Bảng */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '2px solid #f0f0f0' }}>
              <th style={{ textAlign: 'left', padding: '14px 20px', color: '#6b7280', fontWeight: 600 }}>Tài khoản</th>
              <th style={{ textAlign: 'left', padding: '14px 20px', color: '#6b7280', fontWeight: 600 }}>Vai trò</th>
              <th style={{ textAlign: 'left', padding: '14px 20px', color: '#6b7280', fontWeight: 600 }}>Ngày tạo</th>
              <th style={{ textAlign: 'right', padding: '14px 20px', color: '#6b7280', fontWeight: 600 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontWeight: 600, color: '#111' }}>{a.name || '—'}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{a.email}</div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: a.role === 'admin' ? '#fee2e2' : '#dbeafe',
                    color: a.role === 'admin' ? '#991b1b' : '#1e40af',
                  }}>
                    {a.role === 'admin' ? '👑 Admin' : '✏️ Editor'}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', color: '#6b7280', fontSize: 13 }}>
                  {new Date(a.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => openEdit(a)} style={{ padding: '6px 14px', border: '1.5px solid #ee4d2d', borderRadius: 7, color: '#ee4d2d', background: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Sửa</button>
                    <button onClick={() => del(a)} style={{ padding: '6px 14px', border: '1.5px solid #e5e7eb', borderRadius: 7, color: '#6b7280', background: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {admins.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>👤</div>
            <p>Chưa có tài khoản nào</p>
          </div>
        )}
      </div>

      {/* Phân quyền note */}
      <div style={{ marginTop: 20, padding: '16px 20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 13, color: '#92400e' }}>
        <b>📋 Phân quyền:</b>
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div>👑 <b>Admin</b> — toàn quyền: thêm/sửa/xóa sản phẩm, danh mục, quản lý tài khoản</div>
          <div>✏️ <b>Editor</b> — chỉ thêm/sửa/xóa sản phẩm và danh mục, không quản lý tài khoản</div>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                {form.id ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b' }}>
                  ⚠️ {error}
                </div>
              )}

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Họ tên</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nguyễn Văn A" style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email <span style={{ color: '#ee4d2d' }}>*</span></label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Mật khẩu {!form.id && <span style={{ color: '#ee4d2d' }}>*</span>}
                  {form.id && <span style={{ color: '#9ca3af', fontWeight: 400 }}> (để trống nếu không đổi)</span>}
                </label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={form.id ? '••••••••' : 'Nhập mật khẩu'} style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Vai trò</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(['editor', 'admin'] as const).map(r => (
                    <div key={r} onClick={() => setForm(f => ({ ...f, role: r }))}
                      style={{
                        padding: '12px 16px', borderRadius: 10, cursor: 'pointer', border: '2px solid',
                        borderColor: form.role === r ? '#ee4d2d' : '#e5e7eb',
                        background: form.role === r ? '#fff5f3' : 'white',
                        transition: 'all 0.15s',
                      }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{r === 'admin' ? '👑 Admin' : '✏️ Editor'}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>
                        {r === 'admin' ? 'Toàn quyền' : 'Thêm/sửa/xóa sản phẩm'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 28px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 24px', border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: 'white', fontWeight: 600, fontSize: 14, color: '#374151' }}>Hủy</button>
              <button onClick={save} disabled={loading} style={{ padding: '10px 32px', background: loading ? '#f87171' : '#ee4d2d', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Đang lưu...' : form.id ? 'Cập nhật' : 'Tạo tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
