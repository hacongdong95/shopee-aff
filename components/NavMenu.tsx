'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

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

export default function NavMenu({
  categories,
  catSlug,
  primary,
}: {
  categories: Category[]
  catSlug?: string
  primary: string
}) {
  const [openId, setOpenId] = useState<number | null>(null)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)
  const pathname  = usePathname()
  const searchParams = useSearchParams()

  // Lấy cat active từ URL mới nhất (không chỉ prop)
  const activeCat = catSlug ?? searchParams.get('cat') ?? undefined

  const tree = buildTree(categories)

  // Click bên ngoài → đóng dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const openDropdown = (id: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setOpenId(id)
  }

  const closeDropdown = () => {
    timerRef.current = setTimeout(() => setOpenId(null), 150)
  }

  const cancelClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const toggleDropdown = (id: number) => {
    setOpenId(prev => prev === id ? null : id)
  }

  // Check active: slug khớp chính nó hoặc 1 trong các con
  const isActive = (cat: Category) => {
    if (!activeCat) return false
    if (cat.slug === activeCat) return true
    return (cat.children || []).some(c => c.slug === activeCat)
  }

  const isRootActive = !activeCat && pathname === '/'

  return (
    <div style={{
      background: 'rgba(0,0,0,0.14)',
      borderTop: '1px solid rgba(255,255,255,0.12)',
    }}>
      <div
        ref={wrapRef}
        style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 20px',
          display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none',
          position: 'relative',
        }}
      >
        {/* Tab Tất cả sản phẩm */}
        <Link
          href="/"
          onClick={() => setOpenId(null)}
          style={{
            padding: '10px 18px',
            color: isRootActive ? primary : 'rgba(255,255,255,0.88)',
            fontWeight: isRootActive ? 700 : 500,
            fontSize: 13,
            textDecoration: 'none',
            borderBottom: isRootActive ? '3px solid white' : '3px solid transparent',
            background: isRootActive ? 'white' : 'transparent',
            borderRadius: isRootActive ? '6px 6px 0 0' : 0,
            whiteSpace: 'nowrap',
            display: 'block',
            flexShrink: 0,
            transition: 'all 0.15s',
          }}
        >
          Tất cả SP
        </Link>

        {/* Các danh mục cha */}
        {tree.map(cat => {
          const hasChildren = (cat.children?.length || 0) > 0
          const active      = isActive(cat)
          const isOpen      = openId === cat.id

          return (
            <div
              key={cat.id}
              style={{ position: 'relative', flexShrink: 0 }}
              // Hover (desktop)
              onMouseEnter={() => hasChildren ? openDropdown(cat.id) : undefined}
              onMouseLeave={() => hasChildren ? closeDropdown() : undefined}
            >
              {hasChildren ? (
                // Có con → dùng button để toggle, không dùng Link
                <button
                  onClick={() => toggleDropdown(cat.id)}
                  style={{
                    padding: '10px 18px',
                    color: active ? primary : 'rgba(255,255,255,0.88)',
                    fontWeight: active ? 700 : 500,
                    fontSize: 13,
                    textDecoration: 'none',
                    border: 'none',
                    borderBottom: active
                      ? '3px solid white'
                      : isOpen
                      ? '3px solid rgba(255,255,255,0.5)'
                      : '3px solid transparent',
                    background: active
                      ? 'white'
                      : isOpen
                      ? 'rgba(255,255,255,0.15)'
                      : 'transparent',
                    borderRadius: active || isOpen ? '6px 6px 0 0' : 0,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    height: '100%',
                  }}
                >
                  {cat.name}
                  <span style={{
                    fontSize: 9,
                    opacity: 0.75,
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    display: 'inline-block',
                    marginLeft: 2,
                  }}>▼</span>
                </button>
              ) : (
                // Không có con → dùng Link bình thường
                <Link
                  href={`/?cat=${cat.slug}`}
                  onClick={() => setOpenId(null)}
                  style={{
                    padding: '10px 18px',
                    color: active ? primary : 'rgba(255,255,255,0.88)',
                    fontWeight: active ? 700 : 500,
                    fontSize: 13,
                    textDecoration: 'none',
                    borderBottom: active ? '3px solid white' : '3px solid transparent',
                    background: active ? 'white' : 'transparent',
                    borderRadius: active ? '6px 6px 0 0' : 0,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'background 0.15s',
                  }}
                >
                  {cat.name}
                </Link>
              )}

              {/* Dropdown danh mục con */}
              {hasChildren && isOpen && (
                <div
                  onMouseEnter={cancelClose}
                  onMouseLeave={closeDropdown}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    zIndex: 500,
                    background: 'white',
                    borderRadius: '0 8px 8px 8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    minWidth: 210,
                    overflow: 'hidden',
                    animation: 'dropIn 0.15s ease',
                    border: '1px solid #f0f0f0',
                  }}
                >
                  <style>{`
                    @keyframes dropIn {
                      from { opacity:0; transform:translateY(-6px) }
                      to   { opacity:1; transform:translateY(0) }
                    }
                  `}</style>

                  {/* Link xem tất cả danh mục cha */}
                  <Link
                    href={`/?cat=${cat.slug}`}
                    onClick={() => setOpenId(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 16px',
                      textDecoration: 'none',
                      color: activeCat === cat.slug ? primary : '#6b7280',
                      fontWeight: activeCat === cat.slug ? 700 : 500,
                      fontSize: 12,
                      background: activeCat === cat.slug ? `${primary}0d` : '#fafafa',
                      borderBottom: '1px solid #f3f4f6',
                      borderLeft: activeCat === cat.slug ? `3px solid ${primary}` : '3px solid transparent',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>📋</span>
                    <span>Tất cả {cat.name}</span>
                    {activeCat === cat.slug && <span style={{ marginLeft: 'auto', fontSize: 11, color: primary }}>✓</span>}
                  </Link>

                  {/* Danh mục con */}
                  {cat.children!.map(child => {
                    const childActive = activeCat === child.slug
                    return (
                      <Link
                        key={child.id}
                        href={`/?cat=${child.slug}`}
                        onClick={() => setOpenId(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 16px',
                          textDecoration: 'none',
                          color: childActive ? primary : '#374151',
                          fontWeight: childActive ? 700 : 400,
                          fontSize: 13,
                          background: childActive ? `${primary}0d` : 'white',
                          borderLeft: childActive ? `3px solid ${primary}` : '3px solid transparent',
                          transition: 'all 0.1s',
                        }}
                        onMouseEnter={e => {
                          if (!childActive) {
                            (e.currentTarget as HTMLAnchorElement).style.background = '#f9fafb'
                            ;(e.currentTarget as HTMLAnchorElement).style.borderLeftColor = `${primary}66`
                          }
                        }}
                        onMouseLeave={e => {
                          if (!childActive) {
                            (e.currentTarget as HTMLAnchorElement).style.background = 'white'
                            ;(e.currentTarget as HTMLAnchorElement).style.borderLeftColor = 'transparent'
                          }
                        }}
                      >
                        <span style={{ fontSize: 15 }}>{getCatIcon(child.name)}</span>
                        <span>{child.name}</span>
                        {childActive && <span style={{ marginLeft: 'auto', fontSize: 11, color: primary }}>✓</span>}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
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
