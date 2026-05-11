'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'

type Category = {
  id: number
  name: string
  slug: string
  parentId: number | null
  children?: Category[]
}

function buildTree(cats: Category[]): Category[] {
  const map: Record<number, Category> = {}
  cats.forEach(c => { map[c.id] = { ...c, children: [] } })
  const roots: Category[] = []
  cats.forEach(c => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].children!.push(map[c.id])
    } else {
      roots.push(map[c.id])
    }
  })
  return roots
}

export default function CategoryNav({
  categories,
  activeCat,
  primary,
}: {
  categories: Category[]
  activeCat?: string
  primary: string
}) {
  const tree = buildTree(categories)
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = (slug: string, el: HTMLDivElement) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    const rect = el.getBoundingClientRect()
    setDropdownPos({ top: rect.bottom, left: rect.left })
    setOpenSlug(slug)
  }

  const handleMouseLeave = () => {
    leaveTimer.current = setTimeout(() => {
      setOpenSlug(null)
      setDropdownPos(null)
    }, 150)
  }

  const openCat = openSlug ? tree.find(c => c.slug === openSlug) : null

  return (
    <div style={{ background: 'rgba(0,0,0,0.14)', borderTop: '1px solid rgba(255,255,255,0.12)', position: 'relative', zIndex: 100 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none' }}>

        {/* Tab Tất cả */}
        <Link
          href="/"
          style={{
            padding: '10px 18px', color: !activeCat ? primary : 'rgba(255,255,255,0.88)',
            fontWeight: !activeCat ? 700 : 500, fontSize: 13, textDecoration: 'none',
            borderBottom: !activeCat ? '3px solid white' : '3px solid transparent',
            background: !activeCat ? 'white' : 'transparent',
            borderRadius: !activeCat ? '6px 6px 0 0' : 0,
            whiteSpace: 'nowrap', display: 'block',
          }}
        >
          Tất cả
        </Link>

        {/* Danh mục cha */}
        {tree.map(cat => {
          const active = activeCat === cat.slug || cat.children?.some(c => c.slug === activeCat)
          const hasChildren = (cat.children?.length ?? 0) > 0

          return (
            <div
              key={cat.id}
              style={{ position: 'relative' }}
              onMouseEnter={e => hasChildren && handleMouseEnter(cat.slug, e.currentTarget as HTMLDivElement)}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href={`/?cat=${cat.slug}`}
                style={{
                  padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 4,
                  color: active ? primary : 'rgba(255,255,255,0.88)',
                  fontWeight: active ? 700 : 500, fontSize: 13, textDecoration: 'none',
                  borderBottom: active ? '3px solid white' : '3px solid transparent',
                  background: active ? 'white' : 'transparent',
                  borderRadius: active ? '6px 6px 0 0' : 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.name}
                {hasChildren && (
                  <span style={{ fontSize: 9, opacity: 0.7, marginTop: 1 }}>▼</span>
                )}
              </Link>
            </div>
          )
        })}
      </div>

      {/* Dropdown dùng position fixed — thoát khỏi mọi overflow container */}
      {openCat && dropdownPos && (
        <div
          onMouseEnter={() => {
            if (leaveTimer.current) clearTimeout(leaveTimer.current)
          }}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            zIndex: 9999,
            background: 'white',
            borderRadius: '0 8px 8px 8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            minWidth: 180,
            overflow: 'hidden',
            border: '1px solid #f0f0f0',
          }}
        >
          <Link
            href={`/?cat=${openCat.slug}`}
            style={{
              display: 'block', padding: '10px 16px', fontSize: 13,
              color: primary, fontWeight: 700, textDecoration: 'none',
              borderBottom: '1px solid #f5f5f5',
              background: '#fff5f3',
            }}
          >
            Tất cả {openCat.name} →
          </Link>
          {openCat.children!.map(child => (
            <Link
              key={child.id}
              href={`/?cat=${child.slug}`}
              style={{
                display: 'block', padding: '9px 16px', fontSize: 13,
                color: activeCat === child.slug ? primary : '#333',
                fontWeight: activeCat === child.slug ? 700 : 400,
                textDecoration: 'none',
                background: activeCat === child.slug ? '#fff5f3' : 'white',
                borderBottom: '1px solid #f9f9f9',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fff5f3' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = activeCat === child.slug ? '#fff5f3' : 'white' }}
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {/* Breadcrumb: hiện khi đang ở danh mục con */}
      {(() => {
        const activeChild = categories.find(c => c.slug === activeCat && c.parentId !== null)
        const parentCat = activeChild ? categories.find(c => c.id === activeChild.parentId) : null
        if (!activeChild || !parentCat) return null
        return (
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3px 20px 5px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <Link href={`/?cat=${parentCat.slug}`} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
              {parentCat.name}
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>›</span>
            <span style={{ color: 'white', fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 20 }}>
              {activeChild.name}
            </span>
          </div>
        )
      })()}
    </div>
  )
}
