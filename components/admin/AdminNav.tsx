'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminNav({ email }: { email: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    fetch('/api/admin/reviews/unread')
      .then(r => r.json())
      .then(d => setUnread(d.count || 0))
      .catch(() => {})
  }, [pathname])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const link = (href: string, label: string, badge?: number) => (
    <Link
      key={href}
      href={href}
      style={{
        padding: '6px 14px', borderRadius: 6, fontSize: 14, fontWeight: 500,
        textDecoration: 'none', position: 'relative',
        background: pathname === href ? 'rgba(255,255,255,0.2)' : 'transparent',
        color: 'white',
        whiteSpace: 'nowrap',
        display: 'inline-flex', alignItems: 'center', gap: 4,
      }}
    >
      {label}
      {badge && badge > 0 ? (
        <span style={{
          background: '#FFD700', color: '#1a1a1a', fontSize: 10, fontWeight: 800,
          borderRadius: 10, padding: '1px 6px', lineHeight: 1.4,
        }}>{badge}</span>
      ) : null}
    </Link>
  )

  return (
    <nav style={{
      background: 'var(--shopee)', padding: '0 24px',
      display: 'flex', alignItems: 'center', gap: 4, height: 56,
      boxShadow: '0 2px 8px rgba(238,77,45,0.3)',
      overflowX: 'auto', scrollbarWidth: 'none',
    }}>
      <span style={{ color: 'white', fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, marginRight: 8, whiteSpace: 'nowrap' }}>
        Admin
      </span>
      {link('/admin', 'Dashboard')}
      {link('/admin/products', 'San pham')}
      {link('/admin/categories', 'Danh muc')}
      {link('/admin/reviews', 'Binh luan', unread)}
      {link('/admin/accounts', 'Tai khoan')}
      {link('/admin/settings', 'Cai dat')}
      <div style={{ flex: 1 }} />
      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, whiteSpace: 'nowrap' }}>{email}</span>
      <button
        onClick={logout}
        style={{
          background: 'rgba(255,255,255,0.2)', color: 'white',
          border: 'none', padding: '6px 14px', borderRadius: 6,
          cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
        }}
      >
        Dang xuat
      </button>
    </nav>
  )
}
