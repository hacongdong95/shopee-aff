'use client'

import Link from 'next/link'
import { useRef, useState, useEffect } from 'react'

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
    if (c.parentId && map[c.parentId]) map[c.parentId].children!.push(map[c.id])
    else roots.push(map[c.id])
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
  const [dropPos, setDropPos] = useState<{ left: number; top: number } | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const handleMouseEnter = (slug: string) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    // Lấy vị trí element để đặt dropdown đúng chỗ
    const el = itemRefs.current[slug]
    if (el) {
      const rect = el.getBoundingClientRect()
      setDropPos({ left: rect.left, top: rect.bottom })
    }
    setOpenSlug(slug)
  }

  const handleLeave = () => {
    leaveTimer.current = setTimeout(() => {
      setOpenSlug(null)
      setDropPos(null)
    }, 150)
  }

  const keepOpen = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
  }

  // Đóng dropdown khi scroll
  useEffect(() => {
    const h = () => { setOpenSlug(null); setDropPos(null) }
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <>
      <div style={{ background: 'rgba(0,0,0,0.14)', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none' }}>

          {/* Tab Tất cả */}
          <Link href="/" style={{
            padding: '10px 18px',
            color: !activeCat ? primary : 'rgba(255,255,255,0.88)',
            fontWeight: !activeCat ? 700 : 500,
            fontSize: 13, textDecoration: 'none',
            borderBottom: !activeCat ? '3px solid white' : '3px solid transparent',
            background: !activeCat ? 'white' : 'transparent',
            borderRadius: !activeCat ? '6px 6px 0 0' : 0,
            whiteSpace: 'nowrap', display: 'block',
          }}>
            Tất cả
          </Link>

          {/* Danh mục cha */}
          {tree.map(cat => {
            const active = activeCat === cat.slug || cat.children?.some(c => c.slug === activeCat)
            const hasChildren = (cat.children?.length ?? 0) > 0
            const isOpen = openSlug === cat.slug

            return (
              <div
                key={cat.id}
                ref={el => { itemRefs.current[cat.slug] = el }}
                onMouseEnter={() => hasChildren ? handleMouseEnter(cat.slug) : undefined}
                onMouseLeave={hasChildren ? handleLeave : undefined}
              >
                <Link href={`/?cat=${cat.slug}`} style={{
                  padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 4,
                  color: active ? primary : 'rgba(255,255,255,0.88)',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13, textDecoration: 'none',
                  borderBottom: active ? '3px solid white' : '3px solid transparent',
                  background: active ? 'white' : isOpen ? 'rgba(255,255,255,0.12)' : 'transparent',
                  borderRadius: active ? '6px 6px 0 0' : 0,
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s',
                }}>
                  {cat.name}
                  {hasChildren && (
                    <span style={{
                      fontSize: 9, opacity: 0.75,
                      display: 'inline-block',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                    }}>▼</span>
                  )}
                </Link>
              </div>
            )
          })}
        </div>

        {/* Breadcrumb danh mục con */}
        {(() => {
          const activeChild = categories.find(c => c.slug === activeCat && c.parentId !== null)
          const parentCat = activeChild ? categories.find(c => c.id === activeChild.parentId) : null
          if (!activeChild || !parentCat) return null
          return (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3px 20px 5px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <Link href={`/?cat=${parentCat.slug}`} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{parentCat.name}</Link>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>›</span>
              <span style={{ color: 'white', fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 20 }}>{activeChild.name}</span>
            </div>
          )
        })()}
      </div>

      {/* Dropdown — render ngoài sticky header bằng portal-style fixed */}
      {openSlug && dropPos && (() => {
        const cat = tree.find(c => c.slug === openSlug)
        if (!cat || !cat.children?.length) return null
        return (
          <div
            onMouseEnter={keepOpen}
            onMouseLeave={handleLeave}
            style={{
              position: 'fixed',
              top: dropPos.top,
              left: dropPos.left,
              zIndex: 99999,
              background: 'white',
              borderRadius: '0 8px 8px 8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              minWidth: 210,
              overflow: 'hidden',
              border: '1px solid #f0f0f0',
              animation: 'dropIn 0.15s ease',
            }}
          >
            <style>{`@keyframes dropIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* Header danh mục cha */}
            <Link href={`/?cat=${cat.slug}`} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', fontSize: 13,
              color: primary, fontWeight: 700,
              textDecoration: 'none',
              borderBottom: '1px solid #f5f5f5',
              background: `${primary}0d`,
            }}>
              <span style={{ fontSize: 16 }}>📂</span>
              Tất cả {cat.name} →
            </Link>

            {/* Danh mục con */}
            {cat.children.map(child => {
              const childActive = activeCat === child.slug
              return (
                <Link key={child.id} href={`/?cat=${child.slug}`} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 16px', fontSize: 13,
                  color: childActive ? primary : '#374151',
                  fontWeight: childActive ? 700 : 400,
                  textDecoration: 'none',
                  background: childActive ? `${primary}0d` : 'white',
                  borderLeft: `3px solid ${childActive ? primary : 'transparent'}`,
                  borderBottom: '1px solid #f9f9f9',
                  transition: 'all 0.1s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${primary}0d`; (e.currentTarget as HTMLElement).style.borderLeftColor = `${primary}66` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = childActive ? `${primary}0d` : 'white'; (e.currentTarget as HTMLElement).style.borderLeftColor = childActive ? primary : 'transparent' }}
                >
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{getCatIcon(child.name)}</span>
                  <span>{child.name}</span>
                  {childActive && <span style={{ marginLeft: 'auto', color: primary, fontSize: 12 }}>✓</span>}
                </Link>
              )
            })}
          </div>
        )
      })()}
    </>
  )
}

function getCatIcon(name: string): string {
  const n = name.toLowerCase()
  if (/trà|tea/.test(n)) return '🧋'
  if (/sữa|milk/.test(n)) return '🥛'
  if (/thực phẩm|ăn|food/.test(n)) return '🍱'
  if (/vitamin|viên|thuốc/.test(n)) return '💊'
  if (/sức khỏe|health/.test(n)) return '❤️'
  if (/điện tử|electronic/.test(n)) return '⚡'
  if (/điện thoại|phone/.test(n)) return '📱'
  if (/laptop|máy tính/.test(n)) return '💻'
  if (/tai nghe|earphone/.test(n)) return '🎧'
  if (/đồng hồ|watch/.test(n)) return '⌚'
  if (/thời trang|fashion|áo|quần/.test(n)) return '👕'
  if (/giày|dép|shoe/.test(n)) return '👟'
  if (/túi|bag/.test(n)) return '👜'
  if (/nhà|home|nội thất/.test(n)) return '🏠'
  if (/bếp|kitchen/.test(n)) return '🍳'
  if (/đẹp|beauty|mỹ phẩm/.test(n)) return '💄'
  if (/thể thao|sport/.test(n)) return '⚽'
  if (/sách|book/.test(n)) return '📚'
  if (/đồ chơi|toy/.test(n)) return '🧸'
  if (/pet|thú cưng/.test(n)) return '🐾'
  return '🏷️'
}
