'use client'

import { useEffect, useState } from 'react'

type Category = {
  id: number
  name: string
  slug: string
  parentId: number | null
  order: number
  _count?: { products: number }
  children?: Category[]
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 13px',
  border: '1.5px solid #e5e7eb', borderRadius: 8,
  fontSize: 14, outline: 'none', background: 'white',
  boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}

// Build cây từ flat list
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
  // Sort theo order
  const sort = (arr: Category[]) => arr.sort((a, b) => a.order - b.order)
  const sortDeep = (arr: Category[]): Category[] =>
    sort(arr).map(c => ({ ...c, children: sortDeep(c.children || []) }))
  return sortDeep(roots)
}

// Flatten cây → flat (dùng cho select)
function flattenTree(cats: Category[], depth = 0): { cat: Category; depth: number }[] {
  const result: { cat: Category; depth: number }[] = []
  cats.forEach(c => {
    result.push({ cat: c, depth })
    if (c.children?.length) result.push(...flattenTree(c.children, depth + 1))
  })
  return result
}

// Tổng sản phẩm kể cả con
function countTotal(cat: Category): number {
  const self = cat._count?.products || 0
  const childSum = (cat.children || []).reduce((s, c) => s + countTotal(c), 0)
  return self + childSum
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [tree, setTree]             = useState<Category[]>([])
  const [loading, setLoading]       = useState(false)

  // Form thêm/sửa
  const [showForm, setShowForm]   = useState(false)
  const [editCat, setEditCat]     = useState<Category | null>(null)
  const [formName, setFormName]   = useState('')
  const [formParent, setFormParent] = useState<string>('')

  // Expanded nodes
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  // Drag
  const [dragging, setDragging]   = useState<number | null>(null)
  const [dragOver, setDragOver]   = useState<number | null>(null)

  const load = async () => {
    try {
      const res = await fetch('/api/categories?tree=1')
      if (!res.ok) throw new Error('API lỗi')
      const data: Category[] = await res.json()
      setCategories(data)
      setTree(buildTree(data))
      setExpanded(new Set(data.filter(c => !c.parentId).map(c => c.id)))
    } catch (e) {
      console.error('Load categories lỗi:', e)
    }
  }

  useEffect(() => { load() }, [])

  const openAdd = (parentId?: number) => {
    setEditCat(null)
    setFormName('')
    setFormParent(parentId ? String(parentId) : '')
    setShowForm(true)
  }

  const openEdit = (cat: Category) => {
    setEditCat(cat)
    setFormName(cat.name)
    setFormParent(cat.parentId ? String(cat.parentId) : '')
    setShowForm(true)
  }

  const save = async () => {
    if (!formName.trim()) return
    setLoading(true)
    try {
      let res
      if (editCat) {
        res = await fetch(`/api/categories/${editCat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, parentId: formParent ? Number(formParent) : null }),
        })
      } else {
        res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, parentId: formParent ? Number(formParent) : null }),
        })
      }
      if (!res.ok) {
        const err = await res.json()
        alert(`Lỗi: ${err.error || 'Không thể lưu. Tên danh mục có thể đã tồn tại.'}`)
        setLoading(false)
        return
      }
      setShowForm(false)
      await load()
    } catch (e) {
      alert(`Lỗi kết nối: ${e}`)
    }
    setLoading(false)
  }

  const del = async (cat: Category) => {
    const total = countTotal(cat)
    if (!confirm(`Xóa "${cat.name}"?${total > 0 ? `\n⚠️ Có ${total} sản phẩm liên quan, chúng sẽ mất danh mục.` : ''}`)) return
    await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cat.id }),
    })
    await load()
  }

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Drop: chuyển parentId
  const handleDrop = async (targetId: number) => {
    if (!dragging || dragging === targetId) return
    // Không drop vào chính con cháu mình
    const isDec = (id: number, checkId: number): boolean => {
      const c = categories.find(x => x.id === id)
      if (!c) return false
      if (c.parentId === checkId) return true
      return c.parentId ? isDec(c.parentId, checkId) : false
    }
    if (isDec(targetId, dragging)) return

    await fetch(`/api/categories/${dragging}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId: targetId }),
    })
    setDragging(null); setDragOver(null)
    await load()
  }

  const flatList = flattenTree(tree).filter(({ cat }) => {
    let parentId = cat.parentId
    while (parentId !== null && parentId !== undefined) {
      if (!expanded.has(parentId)) return false
      const parent = categories.find(c => c.id === parentId)
      parentId = parent?.parentId ?? null
    }
    return true
  })

  // Tất cả danh mục cha có thể chọn (loại trừ chính nó và con cháu)
  const validParents = (excludeId?: number) => {
    if (!excludeId) return categories
    const getDescendants = (id: number): number[] => {
      const children = categories.filter(c => c.parentId === id)
      return [id, ...children.flatMap(c => getDescendants(c.id))]
    }
    const excluded = new Set(getDescendants(excludeId))
    return categories.filter(c => !excluded.has(c.id))
  }

  const PRIMARY = '#ee4d2d'

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🗂️ Cây danh mục</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            {categories.length} danh mục · Kéo thả để sắp xếp · Click ▶ để mở rộng
          </p>
        </div>
        <button onClick={() => openAdd()} style={{ background: PRIMARY, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          + Thêm danh mục
        </button>
      </div>

      {/* Legend */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: '#92400e', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <span>📁 Danh mục cha — chứa danh mục con</span>
        <span>📄 Danh mục con — chứa sản phẩm trực tiếp</span>
        <span>🔢 Số trong ngoặc = tổng sản phẩm (gồm con)</span>
        <span>🖱️ Kéo thả để chuyển vị trí</span>
      </div>

      {/* Tree */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {flatList.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗂️</div>
            <p style={{ margin: 0 }}>Chưa có danh mục nào</p>
            <button onClick={() => openAdd()} style={{ marginTop: 16, background: PRIMARY, color: 'white', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>+ Thêm ngay</button>
          </div>
        ) : (
          <div>
            {flatList.map(({ cat, depth }) => {
              const hasChildren = (cat.children?.length || 0) > 0
              const isExpanded  = expanded.has(cat.id)
              const isParent    = !cat.parentId
              const total       = countTotal(cat)
              const isDragging  = dragging === cat.id
              const isDragOver  = dragOver === cat.id

              return (
                <div
                  key={cat.id}
                  draggable
                  onDragStart={() => setDragging(cat.id)}
                  onDragOver={e => { e.preventDefault(); setDragOver(cat.id) }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={() => handleDrop(cat.id)}
                  onDragEnd={() => { setDragging(null); setDragOver(null) }}
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: `10px 16px 10px ${16 + depth * 28}px`,
                    borderBottom: '1px solid #f5f5f5',
                    background: isDragOver ? `${PRIMARY}10` : isDragging ? '#f9fafb' : 'white',
                    border: isDragOver ? `1.5px dashed ${PRIMARY}` : undefined,
                    opacity: isDragging ? 0.5 : 1,
                    transition: 'background 0.1s',
                    cursor: 'grab',
                    gap: 8,
                  }}
                >
                  {/* Expand toggle */}
                  <span
                    onClick={() => hasChildren && toggleExpand(cat.id)}
                    style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: hasChildren ? 'pointer' : 'default', color: '#9ca3af', fontSize: 12, flexShrink: 0, transition: 'transform 0.15s', transform: isExpanded ? 'rotate(90deg)' : '' }}
                  >
                    {hasChildren ? '▶' : ''}
                  </span>

                  {/* Icon */}
                  <span style={{ fontSize: 16, flexShrink: 0 }}>
                    {isParent ? (hasChildren ? (isExpanded ? '📂' : '📁') : '📁') : '📄'}
                  </span>

                  {/* Indent line */}
                  {depth > 0 && (
                    <span style={{ color: '#d1d5db', fontSize: 12, marginRight: 2, flexShrink: 0 }}>{'└─'}</span>
                  )}

                  {/* Name */}
                  <span style={{ flex: 1, fontWeight: isParent ? 700 : 500, fontSize: 14, color: '#111', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.name}
                  </span>

                  {/* Slug */}
                  <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', background: '#f5f5f5', padding: '2px 8px', borderRadius: 6, flexShrink: 0 }}>
                    {cat.slug}
                  </span>

                  {/* Count badge */}
                  <span style={{ fontSize: 12, fontWeight: 600, color: total > 0 ? PRIMARY : '#9ca3af', background: total > 0 ? `${PRIMARY}12` : '#f5f5f5', padding: '2px 10px', borderRadius: 20, flexShrink: 0, minWidth: 36, textAlign: 'center' }}>
                    {total}
                  </span>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => openAdd(cat.id)} title="Thêm danh mục con" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#059669', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      + Con
                    </button>
                    <button onClick={() => openEdit(cat)} style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#ea580c', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Sửa
                    </button>
                    <button onClick={() => del(cat)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Xóa
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal thêm/sửa */}
      {showForm && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{editCat ? '✏️ Sửa danh mục' : '➕ Thêm danh mục mới'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#374151' }}>×</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Tên danh mục <span style={{ color: '#ee4d2d' }}>*</span>
                </label>
                <input value={formName} onChange={e => setFormName(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()}
                  placeholder="VD: Trà sữa, Đồ điện tử..." style={inputStyle} autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Danh mục cha <span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af' }}>(bỏ trống = danh mục gốc)</span>
                </label>
                <select value={formParent} onChange={e => setFormParent(e.target.value)} style={inputStyle}>
                  <option value="">📁 Danh mục gốc (cấp 1)</option>
                  {validParents(editCat?.id).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.parentId ? `  └─ ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview cấu trúc */}
              {formName && (
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', border: '1px solid #e5e7eb', fontSize: 13, color: '#374151' }}>
                  <span style={{ color: '#9ca3af', fontSize: 12 }}>Preview: </span>
                  {formParent ? (
                    <>
                      <strong>{categories.find(c => c.id === Number(formParent))?.name}</strong>
                      <span style={{ color: '#9ca3af' }}> → </span>
                    </>
                  ) : null}
                  <strong style={{ color: PRIMARY }}>{formName}</strong>
                </div>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 20px', border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: 'white', fontWeight: 600, fontSize: 14, color: '#374151' }}>Hủy</button>
              <button onClick={save} disabled={loading || !formName.trim()} style={{ padding: '9px 28px', background: loading ? '#f87171' : PRIMARY, color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: !formName.trim() ? 0.6 : 1 }}>
                {loading ? 'Đang lưu...' : editCat ? 'Cập nhật' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
