'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ReviewActions({ id, isHidden }: { id: number; isHidden: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const action = async (type: 'toggle' | 'delete') => {
    if (type === 'delete' && !confirm('Xoa binh luan nay?')) return
    setLoading(true)
    await fetch(`/api/admin/reviews/${id}`, {
      method: type === 'delete' ? 'DELETE' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: type === 'toggle' ? JSON.stringify({ isHidden: !isHidden }) : undefined,
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
      <button
        onClick={() => action('toggle')}
        disabled={loading}
        style={{
          padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
          background: isHidden ? '#f0fdf4' : '#fef9c3',
          color: isHidden ? '#059669' : '#b45309',
        }}
      >
        {isHidden ? 'Hien' : 'An'}
      </button>
      <button
        onClick={() => action('delete')}
        disabled={loading}
        style={{
          padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
          background: '#fef2f2', color: '#dc2626',
        }}
      >
        Xoa
      </button>
    </div>
  )
}
