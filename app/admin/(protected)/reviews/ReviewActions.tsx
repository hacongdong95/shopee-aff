'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ReviewActions({ id, isHidden, comment }: { id: number; isHidden: boolean; comment: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment)

  const action = async (type: 'toggle' | 'delete' | 'edit') => {
    if (type === 'delete' && !confirm('Xoá bình luận này?')) return
    setLoading(true)
    if (type === 'edit') {
      await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: editText }),
      })
      setEditing(false)
    } else if (type === 'toggle') {
      await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: !isHidden }),
      })
    } else {
      await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
    }
    setLoading(false)
    router.refresh()
  }

  if (editing) return (
    <div style={{ marginTop: 10, width: '100%' }}>
      <textarea
        value={editText}
        onChange={e => setEditText(e.target.value)}
        rows={3}
        style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #ee4d2d', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <button onClick={() => action('edit')} disabled={loading}
          style={{ padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#ee4d2d', color: 'white' }}>
          Lưu
        </button>
        <button onClick={() => { setEditing(false); setEditText(comment) }} disabled={loading}
          style={{ padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#f5f5f5', color: '#555' }}>
          Huỷ
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
      <button onClick={() => setEditing(true)} disabled={loading}
        style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#eff6ff', color: '#2563eb' }}>
        ✏️ Sửa
      </button>
      <button onClick={() => action('toggle')} disabled={loading}
        style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: isHidden ? '#f0fdf4' : '#fef9c3', color: isHidden ? '#059669' : '#b45309' }}>
        {isHidden ? '👁️ Hiện' : '🙈 Ẩn'}
      </button>
      <button onClick={() => action('delete')} disabled={loading}
        style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#fef2f2', color: '#dc2626' }}>
        🗑️ Xoá
      </button>
    </div>
  )
}
