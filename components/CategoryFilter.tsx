'use client'

import { Category } from '@prisma/client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CategoryFilter({
  categories,
  activeCat,
}: {
  categories: Category[]
  activeCat?: string
}) {
  const router = useRouter()
  const sp = useSearchParams()

  const setcat = (slug?: string) => {
    const params = new URLSearchParams(sp.toString())
    if (slug) params.set('cat', slug)
    else params.delete('cat')
    router.push('/?' + params.toString())
  }

  const btn = (label: string, slug?: string) => {
    const active = slug ? activeCat === slug : !activeCat
    return (
      <button
        key={slug || 'all'}
        onClick={() => setcat(slug)}
        style={{
          padding: '6px 16px',
          borderRadius: 20,
          border: active ? 'none' : '1px solid var(--border)',
          background: active ? 'var(--shopee)' : 'white',
          color: active ? 'white' : 'var(--text)',
          fontWeight: active ? 700 : 400,
          fontSize: 13,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s',
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      {btn('Tất cả')}
      {categories.map(c => btn(c.name, c.slug))}
    </div>
  )
}
