'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import BuyButton from '@/components/BuyButton'

type Category = { id: number; name: string; slug: string }
type Product = {
  id: number; name: string; slug: string; price: number
  oldPrice: number | null; imageUrl: string | null
  affLink: string; isActive: boolean; clicks: number
  description: string | null; categoryId: number
  category: Category
}
type Settings = Record<string, string>

function parseImages(imageUrl: string | null): string[] {
  if (!imageUrl) return []
  return imageUrl.split('\n').map(u => u.trim()).filter(Boolean)
}

function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}
function getFakeStats(productId: number) {
  const sold    = Math.floor(seededRandom(productId * 3)  * 8000  + 2000)
  const views   = sold + Math.floor(seededRandom(productId * 7)  * 20000 + 5000)
  const reviews = Math.floor(seededRandom(productId * 11) * 800   + 100)
  const rating  = (seededRandom(productId * 13) * 0.5 + 4.4).toFixed(1)
  return { sold, views, reviews, rating }
}

const KEYWORD_ICONS: [RegExp, string][] = [
  [/chính hãng/i, '✅'], [/bảo hành/i, '🛡️'], [/miễn phí/i, '🎁'],
  [/giao hàng|vận chuyển/i, '🚚'], [/khuyến mãi|giảm giá/i, '🔥'],
  [/an toàn/i, '🔒'], [/cao cấp|chất lượng/i, '⭐'], [/mới|new/i, '🆕'],
  [/hot|bán chạy/i, '🔥'], [/tặng kèm/i, '🎀'], [/công nghệ/i, '💡'],
  [/pin|battery/i, '🔋'], [/bluetooth|wifi/i, '📡'], [/kích thước|size/i, '📐'],
  [/màu sắc|màu/i, '🎨'], [/trọng lượng|nặng/i, '⚖️'], [/xuất xứ|thương hiệu/i, '🏷️'],
]
function getLineIcon(text: string): string {
  for (const [regex, icon] of KEYWORD_ICONS) {
    if (regex.test(text)) return icon
  }
  return '▸'
}

function renderDescription(description: string, primary: string) {
  const fixed = description
    .replace(/\\n/g, '\n')
    .replace(/<li>/gi, '\n- ').replace(/<\/li>/gi, '')
    .replace(/<ul>|<\/ul>/gi, '').replace(/<p>/gi, '\n').replace(/<\/p>/gi, '')
    .replace(/<strong>(.*?)<\/strong>/gi, '$1').replace(/<[^>]+>/g, '').trim()

  const lines = fixed.split('\n').map(l => l.trim()).filter(Boolean)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {lines.map((line, i) => {
        const isHeader = line.endsWith(':') || /^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĂĐƠƯ\s]{6,}$/.test(line)
        const isBullet = /^[-•*+]/.test(line) || /^\d+\./.test(line)
        const bulletText = isBullet ? line.replace(/^[-•*+]\s*|^\d+\.\s*/, '') : line
        if (isHeader) return (
          <div key={i} style={{ marginTop: i === 0 ? 0 : 18, marginBottom: 6, padding: '8px 14px', background: `linear-gradient(135deg,${primary}10,${primary}08)`, borderLeft: `3px solid ${primary}`, borderRadius: '0 6px 6px 0', fontSize: 13, fontWeight: 700, color: primary, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📌</span>{line.replace(/:$/, '').toUpperCase()}
          </div>
        )
        if (isBullet) return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 12px', borderRadius: 6, background: i % 2 === 0 ? '#fafafa' : 'white', border: '1px solid #f5f5f5', fontSize: 13, color: '#333', lineHeight: 1.6 }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{getLineIcon(bulletText)}</span>
            <span>{bulletText}</span>
          </div>
        )
        return <p key={i} style={{ margin: '4px 0 8px', fontSize: 13, color: '#555', lineHeight: 1.8, padding: '0 4px' }}>{line}</p>
      })}
    </div>
  )
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ images, startIdx, onClose }: { images: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx)
  const [zoom, setZoom] = useState(false)
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    setZoom(false); setScale(1); setPos({ x: 0, y: 0 })
  }, [idx])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, prev, next])

  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!zoom) {
      const rect = (e.currentTarget as HTMLImageElement).getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * -60
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * -60
      setPos({ x, y }); setScale(2.5); setZoom(true)
    } else {
      setScale(1); setPos({ x: 0, y: 0 }); setZoom(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* Close */}
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: '50%', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>✕</button>

      {/* Counter */}
      <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.7)', fontSize: 13, background: 'rgba(0,0,0,0.4)', padding: '4px 14px', borderRadius: 20 }}>
        {idx + 1} / {images.length}
      </div>

      {/* Zoom hint */}
      <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
        {zoom ? 'Click để thu nhỏ · ESC để đóng' : 'Click ảnh để phóng to · ← → để chuyển'}
      </div>

      {/* Prev */}
      {images.length > 1 && (
        <button onClick={e => { e.stopPropagation(); prev() }} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 48, height: 48, borderRadius: '50%', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, transition: 'background 0.15s' }}>‹</button>
      )}

      {/* Image */}
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '80vw', maxHeight: '85vh', overflow: 'hidden', borderRadius: 8, cursor: zoom ? 'zoom-out' : 'zoom-in' }}>
        <img
          src={images[idx]}
          alt=""
          onClick={toggleZoom}
          style={{
            maxWidth: '80vw', maxHeight: '85vh',
            objectFit: 'contain', display: 'block',
            transform: `scale(${scale}) translate(${pos.x}px, ${pos.y}px)`,
            transition: zoom ? 'none' : 'transform 0.3s ease',
            userSelect: 'none',
          }}
        />
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button onClick={e => { e.stopPropagation(); next() }} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 48, height: 48, borderRadius: '50%', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>›</button>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
          {images.map((url, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{ width: 52, height: 52, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: `2.5px solid ${i === idx ? 'white' : 'rgba(255,255,255,0.2)'}`, background: '#111', transition: 'border-color 0.15s', flexShrink: 0 }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Image Gallery ────────────────────────────────────────────────────────────
function ImageGallery({ images, productName, primary }: { images: string[]; productName: string; primary: string }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (images.length === 0) {
    return (
      <div style={{ width: '100%', paddingTop: '100%', position: 'relative', background: '#fafafa', borderRadius: 4, border: '1px solid #f0f0f0' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, color: '#ddd' }}>🛍️</div>
      </div>
    )
  }

  return (
    <div>
      {/* Ảnh chính — click mở lightbox */}
      <div
        onClick={() => setLightboxOpen(true)}
        style={{ width: '100%', paddingTop: '100%', position: 'relative', background: '#fafafa', borderRadius: 4, overflow: 'hidden', border: '1px solid #f0f0f0', cursor: 'zoom-in' }}
      >
        <img
          src={images[activeIdx]}
          alt={`${productName} ${activeIdx + 1}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 8, transition: 'opacity 0.15s, transform 0.3s' }}
        />
        {/* Zoom hint */}
        <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.45)', color: 'white', fontSize: 11, padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          🔍 Click để phóng to
        </div>
        {images.length > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); setActiveIdx(i => (i - 1 + images.length) % images.length) }}
              style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.35)', color: 'white', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <button onClick={e => { e.stopPropagation(); setActiveIdx(i => (i + 1) % images.length) }}
              style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.35)', color: 'white', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.45)', color: 'white', fontSize: 11, padding: '2px 8px', borderRadius: 10 }}>
              {activeIdx + 1}/{images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'thin' }}>
          {images.map((url, i) => (
            <div key={i} onClick={() => setActiveIdx(i)}
              style={{ flexShrink: 0, width: 60, height: 60, borderRadius: 4, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === activeIdx ? primary : '#f0f0f0'}`, background: '#fafafa', transition: 'border-color 0.15s' }}>
              <img src={url} alt={`thumb ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox images={images} startIdx={activeIdx} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  )
}

// ─── Countdown Flash Sale ─────────────────────────────────────────────────────
function FlashCountdown({ productId }: { productId: number }) {
  const base = (seededRandom(productId * 17) * 3600 + 600) | 0
  const [secs, setSecs] = useState(base)
  useEffect(() => {
    const t = setInterval(() => setSecs(s => s > 0 ? s - 1 : base), 1000)
    return () => clearInterval(t)
  }, [base])
  const h = String(Math.floor(secs / 3600)).padStart(2, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <span style={{ fontWeight: 700, color: '#fff' }}>⚡ Kết thúc sau:</span>
      {[h, m, s].map((v, i) => (
        <span key={i} style={{ background: 'rgba(0,0,0,0.3)', color: 'white', fontWeight: 800, fontSize: 14, padding: '2px 7px', borderRadius: 4, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProductDetail({ product, related, settings = {} }: { product: Product; related: Product[]; settings?: Settings }) {
  const [copied, setCopied] = useState(false)

  const primary        = settings.primary_color    || '#ee4d2d'
  const siteName       = settings.site_name        || 'Shopee Deals'
  const siteEmoji      = settings.site_logo_emoji  || '🛍️'
  const shippingText   = settings.shipping_text    || '🚚 Miễn phí vận chuyển · Giao trong 2-5 ngày'
  const guaranteeText  = settings.guarantee_text   || '✅ Hoàn tiền nếu hàng không đúng mô tả'
  const returnText     = settings.return_text      || '↩️ Đổi trả miễn phí trong 15 ngày'
  const buyButtonText  = settings.buy_button_text  || 'Mua Ngay'
  const shopeeBadge    = settings.shopee_badge     || 'Đảm bảo chính hãng · Giao nhanh'

  const discount = product.oldPrice && product.oldPrice > product.price
    ? Math.round((1 - product.price / product.oldPrice) * 100) : null
  const saved = product.oldPrice && product.oldPrice > product.price
    ? product.oldPrice - product.price : null
  const { sold, views, reviews, rating } = getFakeStats(product.id)
  const images = parseImages(product.imageUrl)

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: "'Be Vietnam Pro', Arial, sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)`, padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', gap: 20, position: 'sticky', top: 0, zIndex: 100, boxShadow: `0 2px 12px ${primary}44` }}>
        <Link href="/" style={{ color: 'white', fontWeight: 800, fontSize: 20, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{siteEmoji}</span> {siteName}
        </Link>
        {/* Flash sale bar in header */}
        {discount && discount >= 10 && (
          <div style={{ marginLeft: 'auto', background: `rgba(0,0,0,0.2)`, borderRadius: 8, padding: '6px 14px' }}>
            <FlashCountdown productId={product.id} />
          </div>
        )}
      </header>

      {/* ── Breadcrumb ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '10px 16px', fontSize: 13, color: '#888', display: 'flex', gap: 6, alignItems: 'center' }}>
        <Link href="/" style={{ color: primary, textDecoration: 'none' }}>Trang chủ</Link>
        <span>›</span>
        <Link href={`/?cat=${product.category.slug}`} style={{ color: primary, textDecoration: 'none' }}>{product.category.name}</Link>
        <span>›</span>
        <span style={{ color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{product.name}</span>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 40px' }}>

        {/* ── Main card ── */}
        <div style={{ background: 'white', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', minHeight: 500 }}>

            {/* Left: Gallery */}
            <div style={{ padding: 20, borderRight: '1px solid #f0f0f0' }}>
              <ImageGallery images={images} productName={product.name} primary={primary} />
              <div
                onClick={() => { fetch(`/api/products/${product.id}/click`, { method: 'POST' }); window.open(product.affLink, '_blank') }}
                style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: `${primary}0d`, border: `1px solid ${primary}33`, borderRadius: 4, cursor: 'pointer' }}
              >
                <span style={{ fontSize: 20 }}>🛒</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: primary }}>Mua tại Shopee</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{shopeeBadge} →</div>
                </div>
              </div>
            </div>

            {/* Right: Info */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column' }}>

              {/* Category + share */}
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: primary, fontWeight: 700, background: `${primary}12`, padding: '3px 10px', borderRadius: 20, border: `1px solid ${primary}33` }}>{product.category.name}</span>
                <button onClick={copyLink} style={{ background: 'none', border: `1px solid #e5e7eb`, borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {copied ? '✅ Đã copy!' : '🔗 Chia sẻ'}
                </button>
              </div>

              <h1 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 400, lineHeight: 1.5, color: '#333' }}>{product.name}</h1>

              {/* Stats */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0', fontSize: 12, color: '#555', flexWrap: 'wrap' }}>
                <span style={{ color: '#f5a623', fontWeight: 600 }}>⭐ {rating}<span style={{ color: '#aaa', fontWeight: 400 }}> ({reviews.toLocaleString('vi-VN')})</span></span>
                <span style={{ color: '#eee' }}>|</span>
                <span>👁 {views.toLocaleString('vi-VN')} lượt xem</span>
                <span style={{ color: '#eee' }}>|</span>
                <span>🛒 <b style={{ color: primary }}>{sold.toLocaleString('vi-VN')}</b> đã bán</span>
                <span style={{ color: '#eee' }}>|</span>
                <span style={{ color: '#26aa99', fontWeight: 600 }}>✅ Còn Hàng</span>
              </div>

              {/* Price */}
              <div style={{ background: '#fafafa', padding: '16px 20px', marginBottom: 16, borderRadius: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: primary }}>{product.price.toLocaleString('vi-VN')}₫</span>
                  {product.oldPrice && product.oldPrice > product.price && (
                    <>
                      <span style={{ fontSize: 16, color: '#999', textDecoration: 'line-through' }}>{product.oldPrice.toLocaleString('vi-VN')}₫</span>
                      {discount && <span style={{ background: primary, color: 'white', fontSize: 13, fontWeight: 700, padding: '2px 8px', borderRadius: 2 }}>-{discount}%</span>}
                    </>
                  )}
                </div>
                {saved && <div style={{ marginTop: 6, fontSize: 13, color: '#26aa99' }}>🎉 Tiết kiệm {saved.toLocaleString('vi-VN')}₫</div>}
              </div>

              {/* Policies - từ settings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, fontSize: 13 }}>
                {[['Vận Chuyển', shippingText], ['Đảm Bảo', guaranteeText], ['Trả Hàng', returnText]].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex' }}>
                    <span style={{ color: '#888', minWidth: 110 }}>{l}</span>
                    <span style={{ color: '#333' }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                <BuyButton productId={product.id} affLink={product.affLink} variant="outline" label="Xem Mô Tả" />
                <BuyButton productId={product.id} affLink={product.affLink} variant="primary" label={buyButtonText} />
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#aaa' }}>Bạn sẽ được chuyển đến Shopee để hoàn tất đặt hàng an toàn</div>
            </div>
          </div>
        </div>

        {/* ── Mô tả sản phẩm ── */}
        {product.description && (
          <div id="product-description" style={{ background: 'white', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', marginBottom: 12, overflow: 'hidden' }}>
            <div style={{ background: `linear-gradient(135deg,${primary}10,${primary}08)`, padding: '14px 20px', borderBottom: `2px solid ${primary}44`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📋</span>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: primary }}>MÔ TẢ SẢN PHẨM</h2>
            </div>
            <div style={{ padding: '20px 24px' }}>{renderDescription(product.description, primary)}</div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'center' }}>
              <BuyButton productId={product.id} affLink={product.affLink} variant="primary" label={`⚡ ${buyButtonText} Tại Shopee`} />
            </div>
          </div>
        )}

        {/* ── Sản phẩm liên quan ── */}
        {related.length > 0 && (
          <div style={{ background: 'white', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ background: '#fafafa', padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 20, background: primary, borderRadius: 2 }} />
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: '#333' }}>CÓ THỂ BẠN THÍCH</h2>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
                {related.map(p => {
                  const disc = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : null
                  const thumb = parseImages(p.imageUrl)[0]
                  return (
                    <Link key={p.id} href={`/san-pham/${p.slug}`} style={{ textDecoration: 'none' }}>
                      <div style={{ border: '1px solid #f0f0f0', borderRadius: 4, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.18s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'}
                        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'}>
                        <div style={{ position: 'relative', paddingTop: '100%', background: '#fafafa' }}>
                          {thumb ? <img src={thumb} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                            : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🛍️</div>}
                          {disc && <div style={{ position: 'absolute', top: 0, left: 0, background: primary, color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 6px' }}>-{disc}%</div>}
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          <div style={{ fontSize: 12, color: '#333', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 32 }}>{p.name}</div>
                          <div style={{ marginTop: 6, color: primary, fontWeight: 700, fontSize: 14 }}>{p.price.toLocaleString('vi-VN')}₫</div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
