import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import ScrollReveal from '@/components/ScrollReveal'
import SortFilter from '@/components/SortFilter'
import FlashSaleCountdown from '@/components/FlashSaleCountdown'
import PopupAd from '@/components/PopupAd'
import CategoryNav from '@/components/CategoryNav'
import SearchBox from '@/components/SearchBox'
import BackToTop from '@/components/BackToTop'

export const revalidate = 60

async function getSettings() {
  const rows = await prisma.setting.findMany()
  const s: Record<string, string> = {}
  for (const row of rows) s[row.key] = row.value
  return s
'use client'

import { useEffect, useState, useRef } from 'react'

type Category = { id: number; name: string }
type Product = {
  id: number; name: string; price: number; oldPrice: number | null
  imageUrl: string | null; affLink: string; isActive: boolean
  clicks: number; category: Category; categoryId: number
  description: string | null
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string; sort?: string; minPrice?: string; maxPrice?: string }>
const empty = {
  name: '', description: '', price: '', oldPrice: '',
  imageUrl: '', affLink: '', categoryId: '', isActive: true,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #e5e7eb', borderRadius: 8,
  fontSize: 14, outline: 'none', background: 'white',
  boxSizing: 'border-box',
}

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode
}) {
  const params    = await searchParams
  const catSlug   = params.cat
  const query     = params.q
  const sort      = params.sort || 'newest'
  const minPrice  = params.minPrice ? Number(params.minPrice) : undefined
  const maxPrice  = params.maxPrice ? Number(params.maxPrice) : undefined

  const [categories, allProducts, settings] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(catSlug ? {
          category: {
            OR: [
              { slug: catSlug },
              { parent: { slug: catSlug } },
            ]
          }
        } : {}),
        ...(query ? { name: { contains: query, mode: 'insensitive' } } : {}),
        ...(minPrice !== undefined || maxPrice !== undefined ? {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          }
        } : {}),
      },
      include: { category: true },
      orderBy:
        sort === 'price_asc'  ? { price: 'asc' }  :
        sort === 'price_desc' ? { price: 'desc' } :
        sort === 'popular'    ? { clicks: 'desc' } :
        { createdAt: 'desc' },
    }),
    getSettings(),
  ])

  const hotProducts = !catSlug && !query
    ? [...allProducts].sort((a, b) => b.clicks - a.clicks).slice(0, 6)
    : []

  const products = sort === 'discount'
    ? [...allProducts].sort((a, b) => {
        const da = a.oldPrice ? (a.oldPrice - a.price) / a.oldPrice : 0
        const db = b.oldPrice ? (b.oldPrice - b.price) / b.oldPrice : 0
        return db - da
      })
    : allProducts

  const primary         = settings.primary_color    || '#ee4d2d'
  const siteName        = settings.site_name        || 'Shopee Deals'
  const siteEmoji       = settings.site_logo_emoji  || '\u{1F6CD}\uFE0F'
  const siteTagline     = settings.site_tagline     || ''
  const bannerShow      = settings.banner_show      !== 'false'
  const bannerImage     = settings.banner_image     || ''
  const bannerLink      = settings.banner_link      || ''
  const bannerTitle     = settings.banner_title     || '\uD83D\uDD25 Deal Hot M\u1ED7i Ng\u00E0y'
  const bannerSubtitle  = settings.banner_subtitle  || 'H\u00E0ng ng\u00E0n s\u1EA3n ph\u1EA9m gi\u1EA3m gi\u00E1 s\u00E2u'
  const footerText      = settings.footer_text      || 'T\u1ED5ng h\u1EE3p s\u1EA3n ph\u1EA9m gi\u1EA3m gi\u00E1 t\u1ED1t nh\u1EA5t'
  const footerCopyright = settings.footer_copyright || '\u00A9 2025 \u00B7 Affiliate Website'
  const footerColor     = settings.footer_color     || '#1a1a1a'
  const shippingText    = settings.shipping_text    || '\uD83D\uDE9A Mi\u1EC5n ph\u00ED v\u1EADn chuy\u1EC3n'
  const guaranteeText   = settings.guarantee_text   || '\u2705 Ho\u00E0n ti\u1EC1n n\u1EBFu kh\u00F4ng \u0111\u00FAng'
  const returnText      = settings.return_text      || '\u21A9\uFE0F \u0110\u1ED5i tr\u1EA3 15 ng\u00E0y'
  const activeCatName   = catSlug ? categories.find(c => c.slug === catSlug)?.name : null
  const popupShow       = settings.popup_show     === 'true'
  const popupImage      = settings.popup_image    || ''
  const popupAffLink    = settings.popup_aff_link || ''
  const popupTitle      = settings.popup_title    || ''
  const popupSubtitle   = settings.popup_subtitle || ''
  const popupBtnText    = settings.popup_btn_text || 'Mua Ngay'
  const popupDelay      = Number(settings.popup_delay || '2')
  const voucherText     = settings.voucher_text   || ''
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#ee4d2d' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function extractNameFromUrl(url: string): string {
  try {
    const decoded = decodeURIComponent(url)
    const match = decoded.match(/shopee\.vn\/([^?#]+)/)
    if (!match) return ''
    return match[1]
      .replace(/-i\.\d+\.\d+.*$/, '')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  } catch { return '' }
}

export default function ProductsPage() {
  const [products, setProducts]     = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm]             = useState<typeof empty & { id?: number }>(empty)
  const [showForm, setShowForm]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll]   = useState(false) // chọn tất cả mọi trang
  const [deleting, setDeleting]     = useState(false)

  // Quick edit
  const [quickEdit, setQuickEdit] = useState<{ id: number; price: string; oldPrice: string } | null>(null)

  // Import hàng loạt
  const [showImport, setShowImport]   = useState(false)
  const [importLinks, setImportLinks] = useState('')
  const [importCat, setImportCat]     = useState('')
  const [importing, setImporting]     = useState(false)
  const [importLog, setImportLog]     = useState<{ text: string; status: 'ok' | 'err' | 'info' | 'done' }[]>([])

  // Scrape
  const [scrapeUrl, setScrapeUrl]           = useState('')
  const [scraping, setScraping]             = useState(false)
  const [scrapeMsg, setScrapeMsg]           = useState('')
  const [fetchingImages, setFetchingImages] = useState(false)
  const [uploading, setUploading]           = useState(false)
  const fileInputRef                        = useRef<HTMLInputElement>(null)

  const load = async () => {
    const [p, c] = await Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ])
    setProducts(p)
    setCategories(c)
    setSelected(new Set())
    setSelectAll(false)
  }

  useEffect(() => { load() }, [])

  const openNew  = () => { setForm(empty); setScrapeUrl(''); setScrapeMsg(''); setShowForm(true) }
  const openEdit = (p: Product) => {
    setForm({ id: p.id, name: p.name, description: p.description || '', price: String(p.price), oldPrice: p.oldPrice ? String(p.oldPrice) : '', imageUrl: p.imageUrl || '', affLink: p.affLink, categoryId: String(p.categoryId), isActive: p.isActive })
    setScrapeUrl(''); setScrapeMsg(''); setShowForm(true)
  }

  // ── Duplicate ─────────────────────────────────────────────────────────────
  const duplicate = async (p: Product) => {
    if (!confirm(`Nhân bản "${p.name}"?`)) return
    await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: p.name + ' (copy)', description: p.description, price: p.price, oldPrice: p.oldPrice, imageUrl: p.imageUrl, affLink: p.affLink, categoryId: p.categoryId, isActive: false }) })
    load()
  }

  // ── Quick edit ────────────────────────────────────────────────────────────
  const saveQuickEdit = async () => {
    if (!quickEdit) return
    await fetch(`/api/products/${quickEdit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price: Number(quickEdit.price), oldPrice: quickEdit.oldPrice ? Number(quickEdit.oldPrice) : null }) })
    setQuickEdit(null); load()
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const getSelectedIds = () => selectAll ? products.map(p => p.id) : [...selected]

  const bulkToggle = async (active: boolean) => {
    const ids = getSelectedIds()
    if (ids.length === 0) return
    await Promise.all(ids.map(id => fetch(`/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: active }) })))
    load()
  }

  const deleteSelected = async () => {
    const ids = getSelectedIds()
    if (!confirm(`Xóa ${ids.length} sản phẩm đã chọn?`)) return
    setDeleting(true)
    await Promise.all(ids.map(id => fetch(`/api/products/${id}`, { method: 'DELETE' })))
    setDeleting(false); load()
  }

  // ── Chọn tất cả kiểu Gmail ───────────────────────────────────────────────
  const toggleSelectFiltered = () => {
    if (selectAll) { setSelectAll(false); setSelected(new Set()); return }
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set()); return
    }
    setSelected(new Set(filtered.map(p => p.id)))
  }

  const handleSelectAll = () => { setSelectAll(true); setSelected(new Set()) }

  // ── Import hàng loạt (kiểu A) ─────────────────────────────────────────────
  const handleImport = async () => {
    const links = importLinks.split('\n').map(l => l.trim()).filter(l => l.includes('shopee'))
    if (links.length === 0) { alert('Không tìm thấy link Shopee hợp lệ!'); return }
    if (!importCat) { alert('Chọn danh mục trước!'); return }
    setImporting(true)
    setImportLog([{ text: `🚀 Bắt đầu import ${links.length} link...`, status: 'info' }])

    let ok = 0; let fail = 0
    for (let i = 0; i < links.length; i++) {
      const url  = links[i]
      const name = extractNameFromUrl(url) || `Sản phẩm ${i + 1}`
      setImportLog(prev => [...prev, { text: `⏳ [${i+1}/${links.length}] ${name}`, status: 'info' }])
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description: null,
            price: 99000,
            oldPrice: 124000,
            imageUrl: null,
            affLink: url,
            categoryId: Number(importCat),
            isActive: false, // ẩn mặc định, cần vào sửa thêm ảnh/giá
          }),
        })
        setImportLog(prev => [...prev.slice(0, -1), { text: `✅ [${i+1}/${links.length}] ${name}`, status: 'ok' }])
        ok++
      } catch (e) {
        setImportLog(prev => [...prev.slice(0, -1), { text: `❌ [${i+1}/${links.length}] Lỗi: ${e}`, status: 'err' }])
        fail++
      }
      await new Promise(r => setTimeout(r, 200))
    }

    setImportLog(prev => [...prev, { text: `🎉 Xong! ${ok} thành công, ${fail} thất bại. Vào sửa từng sản phẩm để thêm ảnh & chỉnh giá.`, status: 'done' }])
    setImporting(false)
    load()
  }

  // ── Scrape ────────────────────────────────────────────────────────────────
  const handleScrape = async () => {
    if (!scrapeUrl.includes('shopee')) { setScrapeMsg('❌ Link Shopee không hợp lệ'); return }
    setScraping(true); setScrapeMsg('⏳ Đang lấy thông tin...')
    try {
      const res = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: scrapeUrl }) })
      const data = await res.json()
      if (!res.ok || data.error) { setScrapeMsg(`❌ ${data.error || 'Thất bại'}`); return }
      setForm(f => ({ ...f, name: data.name || f.name, description: data.description || f.description, price: data.price ? String(data.price) : f.price, oldPrice: data.oldPrice ? String(data.oldPrice) : f.oldPrice, affLink: scrapeUrl }))
      setScrapeMsg('✅ Đã điền! Kiểm tra lại và bấm 🖼️ Lấy ảnh.')
    } catch (e) { setScrapeMsg(`❌ ${e}`) }
    finally { setScraping(false) }
  }

  const handleFetchImages = async () => {
    const link = form.affLink || scrapeUrl
    if (!link) { setScrapeMsg('❌ Nhập link Shopee trước!'); return }
    setFetchingImages(true); setScrapeMsg('⏳ Đang lấy ảnh...')
    try {
      const res = await fetch('/api/shopee-images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: link }) })
      const data = await res.json()
      if (!res.ok || data.error) { setScrapeMsg(`❌ ${data.error}`); return }
      setForm(f => ({ ...f, imageUrl: data.imageUrls.join('\n') }))
      setScrapeMsg(`✅ Lấy được ${data.count} ảnh!`)
    } catch (e) { setScrapeMsg(`❌ ${e}`) }
    finally { setFetchingImages(false) }
  }

  // ── Upload ảnh lên Cloudinary (không cần backend) ────────────────────────
  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true); setScrapeMsg('⏳ Đang tải ảnh lên Cloudinary...')
    try {
      const cloudName  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
      const urls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setScrapeMsg(`⏳ Đang tải ảnh ${i + 1}/${files.length}...`)
        const fd = new FormData()
        fd.append('file', file)
        fd.append('upload_preset', uploadPreset)
        fd.append('folder', 'shopee-aff/products')

        const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd })
        const data = await res.json()
        if (data.secure_url) urls.push(data.secure_url)
        else throw new Error(data.error?.message || 'Upload thất bại')
      }

      // Thêm URL mới vào textarea
      setForm(f => ({
        ...f,
        imageUrl: [...(f.imageUrl ? f.imageUrl.split('\n') : []), ...urls].filter(Boolean).join('\n'),
      }))
      setScrapeMsg(`✅ Đã tải lên ${urls.length} ảnh thành công!`)
    } catch (e) {
      setScrapeMsg(`❌ Lỗi upload: ${e}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const save = async () => {
    if (!form.name || !form.price || !form.affLink || !form.categoryId) { alert('Điền đầy đủ các trường bắt buộc!'); return }
    setLoading(true)
    await fetch(form.id ? `/api/products/${form.id}` : '/api/products', { method: form.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setLoading(false); setShowForm(false); load()
  }

  const del = async (id: number) => {
    if (!confirm('Xóa sản phẩm này?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' }); load()
  }

  const filtered    = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const someSelected = selectAll || selected.size > 0
  const selectedCount = selectAll ? products.length : selected.size
  const allFilteredSelected = !selectAll && selected.size === filtered.length && filtered.length > 0
  const disc = (price: number, old: number | null) => old && old > price ? Math.round((1 - price / old) * 100) : null

return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* HEADER */}
      <header style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}bb 100%)`, position: 'sticky', top: 0, zIndex: 100, boxShadow: `0 2px 20px ${primary}44` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/" style={{ color: 'white', fontWeight: 800, fontSize: 20, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
            <span style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(4px)', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, border: '1px solid rgba(255,255,255,0.3)' }}>{siteEmoji}</span>
            <div>
              <div style={{ fontFamily: 'Nunito, sans-serif', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{siteName}</div>
              {siteTagline && <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.75, lineHeight: 1 }}>{siteTagline}</div>}
            </div>
          </Link>
          <SearchBox defaultValue={query} primary={primary} catSlug={catSlug} />
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Quản lý sản phẩm</h2>
          <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: 13 }}>{products.length} sản phẩm tổng cộng</p>
</div>
        <CategoryNav categories={categories as any} activeCat={catSlug} primary={primary} />
      </header>

      {/* TRUST BAR */}
      <div className="trust-bar" style={{ background: 'white', borderBottom: '1px solid #eee', padding: '9px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap' }}>
          {[shippingText, guaranteeText, returnText].map((t, i) => (
            <span key={i} style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>{t}</span>
          ))}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setShowImport(true); setImportLog([]) }} style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            📥 Import hàng loạt
          </button>
          <button onClick={openNew} style={{ background: '#ee4d2d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + Thêm sản phẩm
          </button>
</div>
</div>

      {/* FLASH SALE */}
      {!catSlug && !query && <FlashSaleCountdown primary={primary} />}

      {/* BANNER */}
      {bannerShow && !catSlug && !query && (
        bannerImage ? (
          bannerLink ? (
            <a href={bannerLink} style={{ display: 'block', width: '100%', lineHeight: 0 }}>
              <img src={bannerImage} alt={bannerTitle} style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
            </a>
          ) : (
            <div style={{ width: '100%', lineHeight: 0 }}>
              <img src={bannerImage} alt={bannerTitle} style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
            </div>
          )
        ) : (
          <div style={{ background: `linear-gradient(135deg, ${primary}ee 0%, ${primary} 50%, ${primary}cc 100%)`, padding: '40px 20px', textAlign: 'center', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -30, left: 40, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
            <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
              <div className="banner-title" style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Nunito, sans-serif', marginBottom: 10, textShadow: '0 2px 12px rgba(0,0,0,0.15)', letterSpacing: '-0.5px' }}>{bannerTitle}</div>
              <div className="banner-sub" style={{ fontSize: 15, opacity: 0.9, maxWidth: 480, margin: '0 auto 20px' }}>{bannerSubtitle}</div>
              <Link href="#products" style={{ display: 'inline-block', background: 'white', color: primary, padding: '11px 28px', borderRadius: 24, fontWeight: 800, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                Xem ưu đãi ngay ↓
              </Link>
            </div>
          </div>
        )
      {/* ── Search + toolbar ── */}
      <div style={{ background: 'white', borderRadius: someSelected ? '10px 10px 0 0' : 10, padding: '10px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: someSelected ? 0 : 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <input type="checkbox"
          checked={allFilteredSelected || selectAll}
          ref={el => { if (el) el.indeterminate = selected.size > 0 && !allFilteredSelected && !selectAll }}
          onChange={toggleSelectFiltered}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#ee4d2d' }} />
        <span style={{ color: '#9ca3af' }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm sản phẩm..."
          style={{ border: 'none', outline: 'none', fontSize: 14, flex: 1, background: 'transparent', minWidth: 150 }} />
      </div>

      {/* ── Bulk action bar (kiểu Gmail) ── */}
      {someSelected && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
            {selectAll ? `Tất cả ${products.length} sản phẩm đã được chọn` : `Đã chọn ${selectedCount} sản phẩm`}
          </span>
          {!selectAll && allFilteredSelected && filtered.length < products.length && (
            <button onClick={handleSelectAll} style={{ background: 'none', border: 'none', color: '#ee4d2d', fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Chọn tất cả {products.length} sản phẩm
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={() => bulkToggle(true)} style={{ background: '#059669', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            👁 Hiện
          </button>
          <button onClick={() => bulkToggle(false)} style={{ background: '#6b7280', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            🚫 Ẩn
          </button>
          <button onClick={deleteSelected} disabled={deleting} style={{ background: deleting ? '#fca5a5' : '#ef4444', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            🗑️ Xóa {selectedCount}
          </button>
          <button onClick={() => { setSelected(new Set()); setSelectAll(false) }} style={{ background: 'white', border: '1.5px solid #e5e7eb', color: '#6b7280', padding: '6px 12px', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            Bỏ chọn
          </button>
        </div>
)}

      <div id="products" style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 16px' }}>
      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, padding: 60, textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p>Chưa có sản phẩm nào</p>
          <button onClick={openNew} style={{ background: '#ee4d2d', color: 'white', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>+ Thêm ngay</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>
          {filtered.map(p => {
            const isSelected  = selectAll || selected.has(p.id)
            const isQuickEdit = quickEdit?.id === p.id
            return (
              <div key={p.id} style={{ background: 'white', borderRadius: 12, boxShadow: isSelected ? '0 0 0 2px #ee4d2d, 0 1px 4px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'box-shadow 0.15s' }}>

                {/* Checkbox */}
                <div onClick={() => { if (selectAll) { setSelectAll(false); const s = new Set(products.map(x => x.id)); s.delete(p.id); setSelected(s) } else { toggleSelectFiltered(); const next = new Set(selected); next.has(p.id) ? next.delete(p.id) : next.add(p.id); setSelected(next) } }}
                  style={{ position: 'absolute', top: 8, left: 8, zIndex: 10, width: 22, height: 22, borderRadius: 6, background: isSelected ? '#ee4d2d' : 'rgba(255,255,255,0.9)', border: isSelected ? '2px solid #ee4d2d' : '2px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'all 0.15s' }}>
                  {isSelected && <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>✓</span>}
                </div>

                <div style={{ position: 'relative', paddingTop: '100%', background: '#f5f5f5' }}>
                  {p.imageUrl
                    ? <img src={p.imageUrl.split('\n')[0].trim()} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#d1d5db' }}>🛍️</div>
                  }
                  {disc(p.price, p.oldPrice) && (
                    <div style={{ position: 'absolute', top: 8, right: 8, background: '#ee4d2d', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>-{disc(p.price, p.oldPrice)}%</div>
                  )}
                  <div style={{ position: 'absolute', bottom: 8, right: 8, background: p.isActive ? '#d1fae5' : '#fee2e2', color: p.isActive ? '#065f46' : '#991b1b', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                    {p.isActive ? 'Hiện' : 'Ẩn'}
                  </div>
                </div>

                <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#ee4d2d', fontWeight: 600 }}>{p.category.name}</div>

        {/* HOT PRODUCTS */}
        {hotProducts.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 4, height: 24, background: primary, borderRadius: 2 }} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>🔥 Bán Chạy Nhất</span>
              <span style={{ fontSize: 12, color: '#888', background: '#f0f0f0', padding: '2px 10px', borderRadius: 20 }}>Top {hotProducts.length}</span>
                  {isQuickEdit ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      <input type="number" value={quickEdit.price} onChange={e => setQuickEdit(q => q ? { ...q, price: e.target.value } : q)} placeholder="Giá hiện tại" style={{ ...inputStyle, padding: '6px 10px', fontSize: 12 }} />
                      <input type="number" value={quickEdit.oldPrice} onChange={e => setQuickEdit(q => q ? { ...q, oldPrice: e.target.value } : q)} placeholder="Giá cũ" style={{ ...inputStyle, padding: '6px 10px', fontSize: 12 }} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={saveQuickEdit} style={{ flex: 1, padding: '6px', background: '#059669', color: 'white', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>✓ Lưu</button>
                        <button onClick={() => setQuickEdit(null)} style={{ flex: 1, padding: '6px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ color: '#ee4d2d', fontWeight: 700, fontSize: 16 }}>{p.price.toLocaleString('vi-VN')}đ</span>
                        {p.oldPrice && <span style={{ color: '#9ca3af', fontSize: 12, textDecoration: 'line-through' }}>{p.oldPrice.toLocaleString('vi-VN')}đ</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>👆 {p.clicks} lượt click</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button onClick={() => openEdit(p)} style={{ flex: 1, padding: '6px', border: '1.5px solid #ee4d2d', borderRadius: 7, color: '#ee4d2d', background: 'white', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Sửa</button>
                        <button onClick={() => setQuickEdit({ id: p.id, price: String(p.price), oldPrice: p.oldPrice ? String(p.oldPrice) : '' })} style={{ flex: 1, padding: '6px', border: '1.5px solid #7c3aed', borderRadius: 7, color: '#7c3aed', background: 'white', fontWeight: 600, fontSize: 12, cursor: 'pointer' }} title="Sửa nhanh giá">💰</button>
                        <button onClick={() => duplicate(p)} style={{ flex: 1, padding: '6px', border: '1.5px solid #059669', borderRadius: 7, color: '#059669', background: 'white', fontWeight: 600, fontSize: 12, cursor: 'pointer' }} title="Nhân bản">⎘</button>
                        <button onClick={() => del(p.id)} style={{ flex: 1, padding: '6px', border: '1.5px solid #e5e7eb', borderRadius: 7, color: '#6b7280', background: 'white', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal Import hàng loạt ── */}
      {showImport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget && !importing) setShowImport(false) }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>📥 Import hàng loạt</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Tạo nhanh nhiều sản phẩm từ link Shopee — ẩn mặc định, vào sửa từng cái để thêm ảnh & chỉnh giá</p>
              </div>
              {!importing && <button onClick={() => setShowImport(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 20 }}>×</button>}
</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
              {hotProducts.map((p, i) => (
                <ScrollReveal key={p.id} delay={i * 50}>
                  <ProductCard product={p} />
                </ScrollReveal>
              ))}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Danh mục" required>
                <select value={importCat} onChange={e => setImportCat(e.target.value)} style={inputStyle}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Danh sách link Shopee (mỗi link 1 dòng)">
                <textarea value={importLinks} onChange={e => setImportLinks(e.target.value)}
                  placeholder={"https://shopee.vn/san-pham-1-i.123.456\nhttps://shopee.vn/san-pham-2-i.789.012"}
                  rows={8} disabled={importing}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }} />
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                  {importLinks.split('\n').filter(l => l.trim().includes('shopee')).length} link hợp lệ
                </div>
              </Field>

              {/* Ghi chú */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#92400e' }}>
                <b>⚡ Import nhanh:</b> Tên lấy từ URL, giá mặc định 99.000đ, ẩn trên trang chủ. Sau đó vào từng sản phẩm để sửa giá thực + thêm ảnh.
              </div>

              {/* Log */}
              {importLog.length > 0 && (
                <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '12px 16px', maxHeight: 200, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12 }}>
                  {importLog.map((log, i) => (
                    <div key={i} style={{ color: log.status === 'ok' ? '#4ade80' : log.status === 'err' ? '#f87171' : log.status === 'done' ? '#fbbf24' : '#94a3b8', marginBottom: 3 }}>
                      {log.text}
                    </div>
                  ))}
                </div>
              )}
</div>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #e0e0e0, transparent)', margin: '32px 0 0' }} />
          </div>
        )}

        <SortFilter currentSort={sort} currentMin={minPrice} currentMax={maxPrice} catSlug={catSlug} query={query} primary={primary} />

        <ScrollReveal>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 4, height: 20, background: primary, borderRadius: 2, display: 'inline-block' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>
                {query ? `Kết quả "${query}"` : activeCatName ? activeCatName : 'Tất cả sản phẩm'}
              </span>
              <span style={{ fontSize: 13, color: '#888', background: '#f0f0f0', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                {products.length} sản phẩm
              </span>
            <div style={{ padding: '16px 28px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {!importing && <button onClick={() => setShowImport(false)} style={{ padding: '10px 24px', border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: 'white', fontWeight: 600, fontSize: 14, color: '#374151' }}>Đóng</button>}
              <button onClick={handleImport} disabled={importing} style={{ padding: '10px 32px', background: importing ? '#9ca3af' : '#7c3aed', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: importing ? 'not-allowed' : 'pointer', minWidth: 140 }}>
                {importing ? '⏳ Đang import...' : '🚀 Bắt đầu import'}
              </button>
</div>
            {(query || catSlug || minPrice || maxPrice) && (
              <Link href="/" style={{ fontSize: 13, color: primary, textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', border: `1.5px solid ${primary}`, borderRadius: 20 }}>
                ✕ Xoá bộ lọc
              </Link>
            )}
</div>
        </ScrollReveal>

        {products.length === 0 ? (
          <ScrollReveal>
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#999' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#444' }}>Không tìm thấy sản phẩm</div>
              <div style={{ fontSize: 14, color: '#aaa', marginBottom: 24 }}>Thử từ khoá khác hoặc xem tất cả sản phẩm</div>
              <Link href="/" style={{ background: primary, color: 'white', padding: '12px 28px', borderRadius: 24, textDecoration: 'none', fontWeight: 700, fontSize: 14, boxShadow: `0 4px 16px ${primary}44` }}>
                Xem tất cả sản phẩm
              </Link>
        </div>
      )}

      {/* ── Modal Thêm/Sửa ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1, borderRadius: '16px 16px 0 0' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{form.id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Điền đầy đủ thông tin sản phẩm bên dưới</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 20, color: '#374151' }}>×</button>
</div>
          </ScrollReveal>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {products.map((p, i) => (
              <ScrollReveal key={p.id} delay={Math.min(i % 6 * 60, 300)}>
                <ProductCard product={p} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>

      {popupShow && popupImage && popupAffLink && (
        <PopupAd imageUrl={popupImage} affLink={popupAffLink} title={popupTitle} subtitle={popupSubtitle} btnText={popupBtnText} primary={primary} delaySeconds={popupDelay} />
      )}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* SCRAPE BOX */}
              <div style={{ background: '#fff8f0', borderRadius: 10, padding: '18px 20px', border: '1.5px solid #fcd9c4' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#c2410c', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🪄 Tự động điền từ link Shopee</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} placeholder="Paste link Shopee vào đây..." style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={handleScrape} disabled={scraping} style={{ background: scraping ? '#fed7aa' : '#ee4d2d', color: 'white', border: 'none', borderRadius: 8, padding: '0 18px', fontWeight: 700, fontSize: 13, cursor: scraping ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                    {scraping ? '⏳...' : '🔍 Lấy info'}
                  </button>
                  <button onClick={handleFetchImages} disabled={fetchingImages} style={{ background: fetchingImages ? '#ddd' : '#fff0ee', color: '#ee4d2d', border: '1.5px solid #ee4d2d', borderRadius: 8, padding: '0 14px', fontWeight: 700, fontSize: 13, cursor: fetchingImages ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                    {fetchingImages ? '⏳...' : '🖼️ Lấy ảnh'}
                  </button>
                </div>
                {scrapeMsg && <div style={{ marginTop: 8, fontSize: 13, color: scrapeMsg.startsWith('✅') ? '#065f46' : scrapeMsg.startsWith('⏳') ? '#92400e' : '#991b1b', fontWeight: 500 }}>{scrapeMsg}</div>}
                <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af' }}>1. Paste link → 🔍 Lấy info | 2. 🖼️ Lấy ảnh → tự điền URLs</div>
              </div>

      <BackToTop primary={primary} />
              {/* Thông tin cơ bản */}
              <div style={{ background: '#fafafa', borderRadius: 10, padding: '18px 20px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Thông tin cơ bản</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Tên sản phẩm" required>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Tai nghe Bluetooth Sony WH-1000XM5" style={inputStyle} />
                  </Field>
                  <Field label="Mô tả">
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả nổi bật của sản phẩm..." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                  </Field>
                  <Field label="Danh mục" required>
                    <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} style={inputStyle}>
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

      <footer style={{ background: footerColor, color: '#aaa', padding: '48px 20px 28px', marginTop: 48 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 20, fontFamily: 'Nunito, sans-serif', marginBottom: 6 }}>{siteEmoji} {siteName}</div>
            <div style={{ fontSize: 13, maxWidth: 400, margin: '0 auto', lineHeight: 1.7, color: 'rgba(255,255,255,0.45)' }}>{footerText}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
            {[shippingText, guaranteeText, returnText].map((t, i) => (
              <span key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}>{t}</span>
            ))}
              {/* Giá */}
              <div style={{ background: '#fafafa', borderRadius: 10, padding: '18px 20px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Giá bán</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Giá hiện tại" required>
                    <div style={{ position: 'relative' }}>
                      <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="119000" style={{ ...inputStyle, paddingRight: 36 }} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}>đ</span>
                    </div>
                    {form.price && <div style={{ fontSize: 11, color: '#ee4d2d', marginTop: 3 }}>{Number(form.price).toLocaleString('vi-VN')}đ</div>}
                  </Field>
                  <Field label="Giá cũ (gạch ngang)">
                    <div style={{ position: 'relative' }}>
                      <input type="number" value={form.oldPrice} onChange={e => setForm(f => ({ ...f, oldPrice: e.target.value }))} placeholder="189000" style={{ ...inputStyle, paddingRight: 36 }} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}>đ</span>
                    </div>
                    {form.price && form.oldPrice && Number(form.oldPrice) > Number(form.price) && (
                      <div style={{ fontSize: 11, color: '#059669', marginTop: 3 }}>Giảm {Math.round((1 - Number(form.price) / Number(form.oldPrice)) * 100)}%</div>
                    )}
                  </Field>
                </div>
              </div>

              {/* Hình ảnh & Link */}
              <div style={{ background: '#fafafa', borderRadius: 10, padding: '18px 20px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hình ảnh & Liên kết</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Link ảnh (mỗi link 1 dòng)">
                    {/* Nút upload + lấy ảnh */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        style={{ background: uploading ? '#ddd' : '#059669', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 12, cursor: uploading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                        📷 {uploading ? 'Đang tải...' : 'Chọn ảnh từ máy'}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={e => handleUploadFiles(e.target.files)}
                      />
                    </div>
                    {/* Drop zone */}
                    <div
                      onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = '#059669' }}
                      onDragLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb' }}
                      onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb'; handleUploadFiles(e.dataTransfer.files) }}
                      style={{ border: '2px dashed #e5e7eb', borderRadius: 8, padding: '12px', textAlign: 'center', fontSize: 12, color: '#9ca3af', marginBottom: 8, cursor: 'pointer', transition: 'border-color 0.2s' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      📂 Kéo thả ảnh vào đây hoặc click để chọn
                    </div>
                    <textarea value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                      placeholder={"https://down-vn.img.susercontent.com/file/abc123\nhttps://down-vn.img.susercontent.com/file/def456"}
                      rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6 }} />
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Mỗi URL 1 dòng — ảnh đầu tiên là ảnh đại diện</div>
                    {form.imageUrl && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {form.imageUrl.split('\n').map(u => u.trim()).filter(Boolean).map((url, i) => (
                          <div key={i} style={{ position: 'relative' }}>
                            <img src={url} alt={`preview ${i+1}`}
                              style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 6, border: i === 0 ? '2px solid #ee4d2d' : '1px solid #e5e7eb', background: '#fafafa', padding: 2 }}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            {i === 0 && <div style={{ position: 'absolute', bottom: 2, left: 2, background: '#ee4d2d', color: 'white', fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 4 }}>Chính</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </Field>
                  <Field label="Link affiliate Shopee" required>
                    <input value={form.affLink} onChange={e => setForm(f => ({ ...f, affLink: e.target.value }))} placeholder="https://shope.ee/..." style={inputStyle} />
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Lấy link từ Shopee Affiliate Center</div>
                  </Field>
                </div>
              </div>

              {/* Trạng thái */}
              <div style={{ background: '#fafafa', borderRadius: 10, padding: '16px 20px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Hiển thị sản phẩm</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Sản phẩm sẽ {form.isActive ? 'xuất hiện' : 'bị ẩn'} trên trang chủ</div>
                </div>
                <div onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  style={{ width: 48, height: 26, borderRadius: 13, cursor: 'pointer', background: form.isActive ? '#ee4d2d' : '#d1d5db', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: form.isActive ? 25 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 28px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10, justifyContent: 'flex-end', position: 'sticky', bottom: 0, background: 'white', borderRadius: '0 0 16px 16px' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 24px', border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: 'white', fontWeight: 600, fontSize: 14, color: '#374151' }}>Hủy</button>
              <button onClick={save} disabled={loading} style={{ padding: '10px 32px', background: loading ? '#f87171' : '#ee4d2d', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', minWidth: 120 }}>
                {loading ? 'Đang lưu...' : form.id ? 'Cập nhật' : 'Thêm sản phẩm'}
              </button>
            </div>
</div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{footerCopyright}</div>
</div>
      </footer>
      )}
</div>
)
}
}