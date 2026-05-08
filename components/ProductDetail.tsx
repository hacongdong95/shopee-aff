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
  const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x)
}
function getFakeStats(id: number) {
  const sold    = Math.floor(seededRandom(id * 3)  * 8000  + 2000)
  const views   = sold + Math.floor(seededRandom(id * 7)  * 20000 + 5000)
  const reviews = Math.floor(seededRandom(id * 11) * 800   + 100)
  const rating  = (seededRandom(id * 13) * 0.5 + 4.4).toFixed(1)
  return { sold, views, reviews, rating }
}
const KEYWORD_ICONS: [RegExp, string][] = [
  [/chính hãng/i,'✅'],[/bảo hành/i,'🛡️'],[/miễn phí/i,'🎁'],
  [/giao hàng|vận chuyển/i,'🚚'],[/khuyến mãi|giảm giá/i,'🔥'],
  [/an toàn/i,'🔒'],[/cao cấp|chất lượng/i,'⭐'],[/mới|new/i,'🆕'],
  [/hot|bán chạy/i,'🔥'],[/tặng kèm/i,'🎀'],[/công nghệ/i,'💡'],
  [/pin|battery/i,'🔋'],[/bluetooth|wifi/i,'📡'],[/kích thước|size/i,'📐'],
  [/màu sắc|màu/i,'🎨'],[/trọng lượng|nặng/i,'⚖️'],[/xuất xứ|thương hiệu/i,'🏷️'],
]
function getLineIcon(text: string) {
  for (const [r, i] of KEYWORD_ICONS) if (r.test(text)) return i
  return '▸'
}
function renderDescription(desc: string, primary: string) {
  const fixed = desc.replace(/\\n/g,'\n').replace(/<br\s*\/?>gi,'\n').replace(/<li>/gi,'\n- ').replace(/<\/li>/gi,'')
    .replace(/<ul>|<\/ul>/gi,'').replace(/<p>/gi,'\n').replace(/<\/p>/gi,'')
    .replace(/<strong>(.*?)<\/strong>/gi,'$1').replace(/<[^>]+>/g,'').trim()
  const lines = fixed.split('\n').map(l => l.trim()).filter(Boolean)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
      {lines.map((line, i) => {
        const isHeader = line.endsWith(':') || /^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĂĐƠƯ\s]{6,}$/.test(line)
        const isBullet = /^[-•*+]/.test(line) || /^\d+\./.test(line)
        const bt = isBullet ? line.replace(/^[-•*+]\s*|^\d+\.\s*/,'') : line
        if (isHeader) return (
          <div key={i} style={{ marginTop:i===0?0:18, marginBottom:6, padding:'8px 14px', background:`${primary}10`, borderLeft:`3px solid ${primary}`, borderRadius:'0 6px 6px 0', fontSize:13, fontWeight:700, color:primary, display:'flex', alignItems:'center', gap:8 }}>
            <span>📌</span>{line.replace(/:$/,'').toUpperCase()}
          </div>
        )
        if (isBullet) return (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'7px 12px', borderRadius:6, background:i%2===0?'#fafafa':'white', border:'1px solid #f5f5f5', fontSize:13, color:'#333', lineHeight:1.6 }}>
            <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>{getLineIcon(bt)}</span>
            <span>{bt}</span>
          </div>
        )
        return <p key={i} style={{ margin:'4px 0 8px', fontSize:13, color:'#555', lineHeight:1.8, padding:'0 4px' }}>{line}</p>
      })}
    </div>
  )
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ images, startIdx, onClose }: { images:string[]; startIdx:number; onClose:()=>void }) {
  const [idx, setIdx] = useState(startIdx)
  const [zoomed, setZoomed] = useState(false)
  const prev = useCallback(() => { setIdx(i=>(i-1+images.length)%images.length); setZoomed(false) }, [images.length])
  const next = useCallback(() => { setIdx(i=>(i+1)%images.length); setZoomed(false) }, [images.length])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if(e.key==='Escape')onClose(); if(e.key==='ArrowLeft')prev(); if(e.key==='ArrowRight')next() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', h)
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [onClose, prev, next])
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.93)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', animation:'fadeIn 0.2s ease' }}>
      <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.15)', border:'none', color:'white', width:40, height:40, borderRadius:'50%', fontSize:20, cursor:'pointer', zIndex:2, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
      <div style={{ position:'absolute', top:20, left:'50%', transform:'translateX(-50%)', color:'rgba(255,255,255,0.6)', fontSize:13, background:'rgba(0,0,0,0.4)', padding:'3px 14px', borderRadius:20 }}>{idx+1} / {images.length}</div>
      {images.length>1 && <button onClick={e=>{e.stopPropagation();prev()}} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.15)', border:'none', color:'white', width:44, height:44, borderRadius:'50%', fontSize:26, cursor:'pointer', zIndex:2, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>}
      <div onClick={e=>{e.stopPropagation();setZoomed(z=>!z)}} style={{ maxWidth:'88vw', maxHeight:'80vh', overflow:'hidden', borderRadius:10, cursor:zoomed?'zoom-out':'zoom-in' }}>
        <img src={images[idx]} alt="" style={{ maxWidth:'88vw', maxHeight:'80vh', objectFit:'contain', display:'block', transform:zoomed?'scale(2.2)':'scale(1)', transition:'transform 0.3s ease', userSelect:'none' }} />
      </div>
      {images.length>1 && <button onClick={e=>{e.stopPropagation();next()}} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.15)', border:'none', color:'white', width:44, height:44, borderRadius:'50%', fontSize:26, cursor:'pointer', zIndex:2, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>}
      {images.length>1 && (
        <div onClick={e=>e.stopPropagation()} style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center', maxWidth:'90vw' }}>
          {images.map((url,i) => (
            <div key={i} onClick={()=>{setIdx(i);setZoomed(false)}} style={{ width:48, height:48, borderRadius:6, overflow:'hidden', cursor:'pointer', border:`2.5px solid ${i===idx?'white':'rgba(255,255,255,0.2)'}`, background:'#111', flexShrink:0, transition:'border-color 0.15s' }}>
              <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
            </div>
          ))}
        </div>
      )}
      <div style={{ position:'absolute', bottom:images.length>1?80:20, left:'50%', transform:'translateX(-50%)', color:'rgba(255,255,255,0.4)', fontSize:11, whiteSpace:'nowrap' }}>
        {zoomed?'Click để thu nhỏ · ESC đóng':'Click để zoom · ← → chuyển ảnh · ESC đóng'}
      </div>
    </div>
  )
}

// ── Gallery ───────────────────────────────────────────────────────────────────
function ImageGallery({ images, name, primary }: { images:string[]; name:string; primary:string }) {
  const [idx, setIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  if (images.length===0) return (
    <div style={{ width:'100%', paddingTop:'100%', position:'relative', background:'#fafafa', borderRadius:8, border:'1px solid #f0f0f0' }}>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:72, color:'#ddd' }}>🛍️</div>
    </div>
  )
  return (
    <div>
      <div onClick={()=>setLightbox(true)} style={{ width:'100%', paddingTop:'100%', position:'relative', background:'#fafafa', borderRadius:8, overflow:'hidden', border:'1px solid #f0f0f0', cursor:'zoom-in' }}>
        <img src={images[idx]} alt={name} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain', padding:8, transition:'opacity 0.2s' }} />
        <div style={{ position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.45)', color:'white', fontSize:11, padding:'3px 12px', borderRadius:20, whiteSpace:'nowrap', pointerEvents:'none' }}>🔍 Click để phóng to</div>
        {images.length>1 && <>
          <button onClick={e=>{e.stopPropagation();setIdx(i=>(i-1+images.length)%images.length)}} style={{ position:'absolute', left:6, top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.35)', color:'white', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
          <button onClick={e=>{e.stopPropagation();setIdx(i=>(i+1)%images.length)}} style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.35)', color:'white', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
          <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.45)', color:'white', fontSize:11, padding:'2px 8px', borderRadius:10 }}>{idx+1}/{images.length}</div>
        </>}
      </div>
      {images.length>1 && (
        <div style={{ display:'flex', gap:6, marginTop:10, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
          {images.map((url,i) => (
            <div key={i} onClick={()=>setIdx(i)} style={{ flexShrink:0, width:56, height:56, borderRadius:6, overflow:'hidden', cursor:'pointer', border:`2px solid ${i===idx?primary:'#f0f0f0'}`, background:'#fafafa', transition:'border-color 0.15s' }}>
              <img src={url} alt={`thumb ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'contain', padding:2 }} />
            </div>
          ))}
        </div>
      )}
      {lightbox && <Lightbox images={images} startIdx={idx} onClose={()=>setLightbox(false)} />}
    </div>
  )
}

// ── Flash Countdown ───────────────────────────────────────────────────────────
function FlashCountdown({ productId }: { productId:number }) {
  const base = (seededRandom(productId*17)*3600+600)|0
  const [secs, setSecs] = useState(base)
  useEffect(() => { const t=setInterval(()=>setSecs(s=>s>0?s-1:base),1000); return ()=>clearInterval(t) },[base])
  const h=String(Math.floor(secs/3600)).padStart(2,'0')
  const m=String(Math.floor((secs%3600)/60)).padStart(2,'0')
  const s=String(secs%60).padStart(2,'0')
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11 }}>
      <span style={{ color:'white', fontWeight:700 }}>⚡ Còn:</span>
      {[h,m,s].map((v,i)=>(
        <span key={i} style={{ background:'rgba(0,0,0,0.35)', color:'white', fontWeight:800, fontSize:13, padding:'2px 6px', borderRadius:4, fontVariantNumeric:'tabular-nums' }}>{v}</span>
      ))}
    </div>
  )
}

// ── Marquee Banner ────────────────────────────────────────────────────────────
function MarqueeBanner({ primary, items }: { primary:string; items:string[] }) {
  const text = items.join('   •   ')
  return (
    <div style={{ background:`${primary}15`, borderBottom:`1px solid ${primary}25`, overflow:'hidden', height:32, display:'flex', alignItems:'center' }}>
      <div style={{
        display:'flex', gap:0, whiteSpace:'nowrap',
        animation:'marquee 28s linear infinite',
      }}>
        {[0,1,2].map(k => (
          <span key={k} style={{ fontSize:12, color:primary, fontWeight:600, paddingRight:60 }}>
            {text}
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-33.33%)}}`}</style>
    </div>
  )
}

// ── Sticky Buy Bar (mobile) ───────────────────────────────────────────────────
function StickyBuyBar({ product, primary, buyButtonText }: { product:Product; primary:string; buyButtonText:string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const h = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', h, { passive:true })
    return () => window.removeEventListener('scroll', h)
  }, [])
  if (!visible) return null
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:200, background:'white', borderTop:'1px solid #eee', padding:'10px 16px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 -4px 16px rgba(0,0,0,0.1)', animation:'slideUp 0.2s ease' }}>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'#333', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{product.name}</div>
        <div style={{ fontSize:15, fontWeight:800, color:primary }}>{product.price.toLocaleString('vi-VN')}₫</div>
      </div>
      <a href={product.affLink} target="_blank" rel="noopener noreferrer"
        onClick={()=>fetch(`/api/products/${product.id}/click`,{method:'POST'}).catch(()=>{})}
        style={{ background:primary, color:'white', padding:'10px 20px', borderRadius:8, fontWeight:700, fontSize:14, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>
        ⚡ {buyButtonText}
      </a>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProductDetail({ product, related, settings={} }: { product:Product; related:Product[]; settings?:Settings }) {
  const [copied, setCopied] = useState(false)

  const primary       = settings.primary_color   || '#ee4d2d'
  const siteName      = settings.site_name       || 'Shopee Deals'
  const siteEmoji     = settings.site_logo_emoji || '🛍️'
  const siteTagline   = settings.site_tagline    || ''
  const shippingText  = settings.shipping_text   || '🚚 Miễn phí vận chuyển · Giao trong 2-5 ngày'
  const guaranteeText = settings.guarantee_text  || '✅ Hoàn tiền nếu hàng không đúng mô tả'
  const returnText    = settings.return_text     || '↩️ Đổi trả miễn phí trong 15 ngày'
  const buyBtnText    = settings.buy_button_text || 'Mua Ngay'
  const shopeeBadge   = settings.shopee_badge    || 'Đảm bảo chính hãng · Giao nhanh'
  const footerText    = settings.footer_text     || 'Tổng hợp sản phẩm giảm giá tốt nhất từ Shopee'
  const footerCopy    = settings.footer_copyright|| '© 2025 · Affiliate Website'
  const footerColor   = settings.footer_color    || '#1a1a1a'

  const discount = product.oldPrice && product.oldPrice > product.price
    ? Math.round((1-product.price/product.oldPrice)*100) : null
  const saved = product.oldPrice && product.oldPrice > product.price
    ? product.oldPrice - product.price : null
  const { sold, views, reviews, rating } = getFakeStats(product.id)
  const images = parseImages(product.imageUrl)

  const copyLink = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(()=>setCopied(false),2000) }

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5', fontFamily:"'Be Vietnam Pro', Arial, sans-serif", paddingBottom:80 }}>

      {/* ── Marquee trust bar ── */}
      <MarqueeBanner primary={primary} items={[shippingText, guaranteeText, returnText, shopeeBadge]} />

      {/* ── Header ── */}
      <header style={{ background:`linear-gradient(135deg,${primary} 0%,${primary}cc 100%)`, position:'sticky', top:0, zIndex:100, boxShadow:`0 2px 16px ${primary}44` }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 16px', height:56, display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/" style={{ color:'white', fontWeight:800, fontSize:18, textDecoration:'none', display:'flex', alignItems:'center', gap:8, flexShrink:0, minWidth:0 }}>
            <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:8, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{siteEmoji}</span>
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontFamily:'Nunito,sans-serif', letterSpacing:'-0.5px', lineHeight:1.1, fontSize:16, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:160 }}>{siteName}</div>
              {siteTagline && <div style={{ fontSize:10, opacity:0.75, lineHeight:1, whiteSpace:'nowrap' }}>{siteTagline}</div>}
            </div>
          </Link>
          <div style={{ flex:1 }} />
          {discount && discount>=10 && (
            <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'5px 10px', flexShrink:0 }}>
              <FlashCountdown productId={product.id} />
            </div>
          )}
        </div>
      </header>

      {/* ── Breadcrumb ── */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'10px 16px', fontSize:12, color:'#888', display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
        <Link href="/" style={{ color:primary, textDecoration:'none' }}>Trang chủ</Link>
        <span>›</span>
        <Link href={`/?cat=${product.category.slug}`} style={{ color:primary, textDecoration:'none' }}>{product.category.name}</Link>
        <span>›</span>
        <span style={{ color:'#555', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>{product.name}</span>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 16px 24px' }}>

        {/* ── Main product card ── */}
        <div style={{ background:'white', borderRadius:12, boxShadow:'0 2px 12px rgba(0,0,0,0.08)', marginBottom:16, overflow:'hidden' }}>
          {/* Desktop: 2 cột | Mobile: 1 cột */}
          <div style={{ display:'grid', gridTemplateColumns:'clamp(280px,40%,420px) 1fr' }}>

            {/* Left: Gallery */}
            <div style={{ padding:16, borderRight:'1px solid #f5f5f5' }}>
              <ImageGallery images={images} name={product.name} primary={primary} />
              {/* Mua tại Shopee box */}
              <div onClick={()=>{fetch(`/api/products/${product.id}/click`,{method:'POST'});window.open(product.affLink,'_blank')}}
                style={{ marginTop:12, display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:`${primary}0d`, border:`1px solid ${primary}33`, borderRadius:8, cursor:'pointer', transition:'background 0.15s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background=`${primary}18`}
                onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background=`${primary}0d`}>
                <span style={{ fontSize:22 }}>🛒</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:primary }}>Mua tại Shopee</div>
                  <div style={{ fontSize:11, color:'#888' }}>{shopeeBadge} →</div>
                </div>
              </div>
            </div>

            {/* Right: Info */}
            <div style={{ padding:'20px 20px 20px', display:'flex', flexDirection:'column', minWidth:0 }}>
              {/* Category + share */}
              <div style={{ marginBottom:8, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, color:primary, fontWeight:700, background:`${primary}12`, padding:'3px 10px', borderRadius:20, border:`1px solid ${primary}33` }}>{product.category.name}</span>
                <button onClick={copyLink} style={{ background:'none', border:'1px solid #e5e7eb', borderRadius:20, padding:'4px 12px', fontSize:12, color:'#666', cursor:'pointer', display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>
                  {copied?'✅ Đã copy!':'🔗 Chia sẻ'}
                </button>
              </div>

              <h1 style={{ margin:'0 0 10px', fontSize:18, fontWeight:500, lineHeight:1.5, color:'#222' }}>{product.name}</h1>

              {/* Stats */}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingBottom:14, borderBottom:'1px solid #f5f5f5', fontSize:12, color:'#666', flexWrap:'wrap' }}>
                <span style={{ color:'#f5a623', fontWeight:600 }}>⭐ {rating} <span style={{ color:'#aaa', fontWeight:400 }}>({reviews.toLocaleString('vi-VN')})</span></span>
                <span style={{ color:'#ddd' }}>|</span>
                <span>🛒 <b style={{ color:primary }}>{sold.toLocaleString('vi-VN')}</b> đã bán</span>
                <span style={{ color:'#ddd' }}>|</span>
                <span style={{ color:'#26aa99', fontWeight:600 }}>✅ Còn Hàng</span>
              </div>

              {/* Price */}
              <div style={{ background:'#fafafa', padding:'14px 16px', marginBottom:14, borderRadius:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  <span style={{ fontSize:30, fontWeight:800, color:primary }}>{product.price.toLocaleString('vi-VN')}₫</span>
                  {product.oldPrice && product.oldPrice > product.price && <>
                    <span style={{ fontSize:15, color:'#bbb', textDecoration:'line-through' }}>{product.oldPrice.toLocaleString('vi-VN')}₫</span>
                    {discount && <span style={{ background:primary, color:'white', fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:4 }}>-{discount}%</span>}
                  </>}
                </div>
                {saved && <div style={{ marginTop:4, fontSize:13, color:'#26aa99' }}>🎉 Tiết kiệm {saved.toLocaleString('vi-VN')}₫</div>}
              </div>

              {/* Policies */}
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:18, fontSize:13 }}>
                {([['Vận Chuyển',shippingText],['Đảm Bảo',guaranteeText],['Trả Hàng',returnText]] as [string,string][]).map(([l,v])=>(
                  <div key={l} style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <span style={{ color:'#999', minWidth:90, fontSize:12 }}>{l}</span>
                    <span style={{ color:'#333', fontSize:12, flex:1 }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div style={{ display:'flex', gap:10, marginTop:'auto', flexWrap:'wrap' }}>
                <BuyButton productId={product.id} affLink={product.affLink} variant="outline" label="Xem Mô Tả" />
                <BuyButton productId={product.id} affLink={product.affLink} variant="primary" label={buyBtnText} />
              </div>
              <div style={{ marginTop:8, fontSize:11, color:'#bbb' }}>Bạn sẽ được chuyển đến Shopee để hoàn tất đặt hàng an toàn</div>
            </div>
          </div>
        </div>

        {/* ── Mô tả ── */}
        {product.description && (
          <div id="product-description" style={{ background:'white', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', marginBottom:16, overflow:'hidden' }}>
            <div style={{ background:`${primary}0e`, padding:'14px 20px', borderBottom:`2px solid ${primary}33`, display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:20 }}>📋</span>
              <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:primary }}>MÔ TẢ SẢN PHẨM</h2>
            </div>
            <div style={{ padding:'20px 20px' }}>{renderDescription(product.description, primary)}</div>
            <div style={{ padding:'16px 20px', borderTop:'1px solid #f5f5f5', display:'flex', justifyContent:'center' }}>
              <BuyButton productId={product.id} affLink={product.affLink} variant="primary" label={`⚡ ${buyBtnText} Tại Shopee`} />
            </div>
          </div>
        )}

        {/* ── Sản phẩm liên quan ── */}
        {related.length>0 && (
          <div style={{ background:'white', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', overflow:'hidden' }}>
            <div style={{ background:'#fafafa', padding:'14px 20px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:4, height:20, background:primary, borderRadius:2 }} />
              <h2 style={{ margin:0, fontSize:15, fontWeight:700, color:'#333' }}>CÓ THỂ BẠN THÍCH</h2>
            </div>
            <div style={{ padding:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
                {related.map(p => {
                  const disc = p.oldPrice && p.oldPrice > p.price ? Math.round((1-p.price/p.oldPrice)*100) : null
                  const thumb = parseImages(p.imageUrl)[0]
                  return (
                    <Link key={p.id} href={`/san-pham/${p.slug}`} style={{ textDecoration:'none' }}>
                      <div style={{ border:'1px solid #f0f0f0', borderRadius:8, overflow:'hidden', cursor:'pointer', transition:'box-shadow 0.18s, transform 0.18s', background:'white' }}
                        onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 6px 20px rgba(0,0,0,0.1)';(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='none';(e.currentTarget as HTMLDivElement).style.transform=''}}>
                        <div style={{ position:'relative', paddingTop:'100%', background:'#fafafa' }}>
                          {thumb?<img src={thumb} alt={p.name} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain', padding:4 }} />
                            :<div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>🛍️</div>}
                          {disc && <div style={{ position:'absolute', top:0, left:0, background:primary, color:'white', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:'0 0 6px 0' }}>-{disc}%</div>}
                        </div>
                        <div style={{ padding:'8px 10px' }}>
                          <div style={{ fontSize:12, color:'#333', lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', minHeight:32 }}>{p.name}</div>
                          <div style={{ marginTop:5, color:primary, fontWeight:700, fontSize:14 }}>{p.price.toLocaleString('vi-VN')}₫</div>
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

      {/* ── Footer ── */}
      <footer style={{ background:footerColor, color:'#aaa', padding:'40px 20px 100px', marginTop:8 }}>
        <div style={{ maxWidth:1100, margin:'0 auto', textAlign:'center' }}>
          <div style={{ color:'white', fontWeight:800, fontSize:18, fontFamily:'Nunito,sans-serif', marginBottom:6 }}>{siteEmoji} {siteName}</div>
          <div style={{ fontSize:13, maxWidth:400, margin:'0 auto 20px', lineHeight:1.7, color:'rgba(255,255,255,0.4)' }}>{footerText}</div>
          <div style={{ display:'flex', justifyContent:'center', gap:10, flexWrap:'wrap', marginBottom:20 }}>
            {[shippingText, guaranteeText, returnText].map((t,i)=>(
              <span key={i} style={{ fontSize:12, color:'rgba(255,255,255,0.45)', background:'rgba(255,255,255,0.06)', padding:'5px 14px', borderRadius:20, border:'1px solid rgba(255,255,255,0.08)' }}>{t}</span>
            ))}
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:16, fontSize:12, color:'rgba(255,255,255,0.25)' }}>{footerCopy}</div>
        </div>
      </footer>

      {/* ── Sticky Buy Bar mobile ── */}
      <StickyBuyBar product={product} primary={primary} buyButtonText={buyBtnText} />
    </div>
  )
}
