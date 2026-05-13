'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import BuyButton from '@/components/BuyButton'
import CategoryNav from '@/components/CategoryNav'

type Category = { id: number; name: string; slug: string }
type Product = {
  id: number; name: string; slug: string; price: number
  oldPrice: number | null; imageUrl: string | null
  affLink: string; isActive: boolean; clicks: number
  description: string | null; categoryId: number
  category: Category
}
type Settings = Record<string, string>
type Review = {
  id: number; name: string; rating: number; comment: string; createdAt: string; likes: number
}

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
  const fixed = desc.replace(/\\n/g,'\n').replace(/<br\s*\/?>/gi,'\n').replace(/<li>/gi,'\n- ').replace(/<\/li>/gi,'')
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
      <div style={{ display:'flex', gap:0, whiteSpace:'nowrap', animation:'marquee 28s linear infinite' }}>
        {[0,1,2].map(k => (
          <span key={k} style={{ fontSize:12, color:primary, fontWeight:600, paddingRight:60 }}>{text}</span>
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

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRow({ value, onChange, size=24 }: { value:number; onChange?:(v:number)=>void; size?:number }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{ fontSize:size, cursor:onChange?'pointer':'default', lineHeight:1, transition:'transform 0.1s', transform: onChange && (hover||value)>=i ? 'scale(1.15)':'scale(1)', userSelect:'none' }}>
          {(hover||value) >= i ? '⭐' : '☆'}
        </span>
      ))}
    </div>
  )
}

// ── Like Button ───────────────────────────────────────────────────────────────
function LikeButton({ reviewId, initialLikes, primary }: { reviewId: number; initialLikes: number; primary: string }) {
  const [likes, setLikes] = useState(initialLikes)
  const [liked, setLiked] = useState(false)
  const [anim, setAnim] = useState(false)

  const handleLike = async () => {
    if (liked) return
    setLiked(true)
    setAnim(true)
    setTimeout(() => setAnim(false), 400)
    const res = await fetch(`/api/reviews/${reviewId}/like`, { method: 'POST' })
    const d = await res.json()
    setLikes(d.likes)
  }

  return (
    <button onClick={handleLike} disabled={liked}
      style={{
        marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
        background: liked ? '#fee2e2' : '#f5f5f5',
        border: `1.5px solid ${liked ? '#fca5a5' : '#e5e7eb'}`,
        borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600,
        color: liked ? '#e74c3c' : '#888', cursor: liked ? 'default' : 'pointer',
        transition: 'all 0.2s',
        transform: anim ? 'scale(1.2)' : 'scale(1)',
      }}>
      {liked ? '❤️' : '🤍'} {likes}
    </button>
  )
}

// ── Reviews Section ───────────────────────────────────────────────────────────
// Mask tên kiểu Shopee: "Nguyễn Văn Minh" → "Nguyễn V*** h"
function maskName(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) {
    const w = parts[0]
    if (w.length <= 2) return w
    return w[0] + '***' + w[w.length - 1]
  }
  // Họ giữ nguyên, đệm ẩn, tên ẩn giữa
  return parts.map((w, i) => {
    if (i === 0) return w // Họ: giữ nguyên
    if (i === parts.length - 1) {
      // Tên cuối: giữ chữ đầu + *** + chữ cuối
      if (w.length <= 1) return w + '***'
      return w[0] + '***' + w[w.length - 1]
    }
    // Đệm giữa: chỉ giữ chữ đầu + ***
    return w[0] + '***'
  }).join(' ')
}

function ReviewsSection({ productId, primary }: { productId:number; primary:string }) {
  const [reviews, setReviews]   = useState<Review[]>([])
  const [loading, setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]       = useState('')

  // Form state
  const [name, setName]       = useState('')
  const [rating, setRating]   = useState(0)
  const [comment, setComment] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/reviews?productId=${productId}`)
    const data = await res.json()
    setReviews(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [productId])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    setError('')
    if (!name.trim()) return setError('Vui lòng nhập tên của bạn')
    if (rating === 0) return setError('Vui lòng chọn số sao')
    if (!comment.trim()) return setError('Vui lòng nhập nội dung đánh giá')
    if (comment.trim().length < 10) return setError('Đánh giá phải ít nhất 10 ký tự')

    setSubmitting(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, name, rating, comment }),
    })
    setSubmitting(false)
    if (res.ok) {
      setSubmitted(true)
      setName(''); setRating(0); setComment('')
      load()
    } else {
      const d = await res.json()
      setError(d.error || 'Có lỗi xảy ra, thử lại sau')
    }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const ratingDist = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? Math.round(reviews.filter(r => r.rating === star).length / reviews.length * 100) : 0,
  }))

  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'10px 14px', border:'1.5px solid #e5e7eb',
    borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box',
    fontFamily:'inherit', transition:'border-color 0.15s',
  }

  return (
    <div style={{ background:'white', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', marginBottom:16, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ background:`${primary}0e`, padding:'14px 20px', borderBottom:`2px solid ${primary}33`, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20 }}>💬</span>
        <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:primary }}>ĐÁNH GIÁ SẢN PHẨM</h2>
        {reviews.length > 0 && (
          <span style={{ fontSize:12, background:`${primary}18`, color:primary, padding:'2px 10px', borderRadius:20, fontWeight:600 }}>
            {reviews.length} đánh giá
          </span>
        )}
      </div>

      <div style={{ padding:20 }}>

        {/* Tổng quan rating */}
        {reviews.length > 0 && (
          <div style={{ display:'flex', gap:20, marginBottom:24, padding:16, background:'#fafafa', borderRadius:10, border:'1px solid #f0f0f0', flexWrap:'wrap' }}>
            {/* Điểm trung bình */}
            <div style={{ textAlign:'center', minWidth:80 }}>
              <div style={{ fontSize:42, fontWeight:800, color:primary, lineHeight:1 }}>{avgRating}</div>
              <StarRow value={Math.round(Number(avgRating))} size={16} />
              <div style={{ fontSize:11, color:'#999', marginTop:4 }}>{reviews.length} đánh giá</div>
            </div>
            {/* Phân phối sao */}
            <div style={{ flex:1, minWidth:160, display:'flex', flexDirection:'column', gap:5, justifyContent:'center' }}>
              {ratingDist.map(({ star, count, pct }) => (
                <div key={star} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                  <span style={{ width:12, textAlign:'right', color:'#555', fontWeight:600 }}>{star}</span>
                  <span style={{ fontSize:13 }}>⭐</span>
                  <div style={{ flex:1, height:6, background:'#f0f0f0', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background: star >= 4 ? primary : star === 3 ? '#f39c12' : '#e74c3c', borderRadius:4, transition:'width 0.5s ease' }} />
                  </div>
                  <span style={{ width:28, color:'#999' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Danh sách đánh giá */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:'#aaa', fontSize:13 }}>Đang tải đánh giá...</div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign:'center', padding:'20px 0 8px', color:'#bbb' }}>
            <div style={{ fontSize:36, marginBottom:6 }}>📝</div>
            <div style={{ fontSize:13 }}>Chưa có đánh giá nào. Hãy là người đầu tiên!</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
            {reviews.map(r => (
              <div key={r.id} style={{ padding:'12px 14px', background:'#fafafa', borderRadius:8, border:'1px solid #f0f0f0' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:`${primary}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:primary, flexShrink:0 }}>
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight:700, fontSize:13, color:'#222' }}>{maskName(r.name)}</span>
                  <StarRow value={r.rating} size={14} />
                  <span style={{ fontSize:11, color:'#bbb', marginLeft:'auto' }}>
                    {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p style={{ margin:0, fontSize:13, color:'#444', lineHeight:1.7 }}>{r.comment}</p>
                <LikeButton reviewId={r.id} initialLikes={r.likes ?? 0} primary={primary} />
              </div>
            ))}
          </div>
        )}

        {/* Form đánh giá */}
        <div style={{ borderTop:'1px solid #f0f0f0', paddingTop:20 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#222', marginBottom:14 }}>
            {submitted ? '✅ Cảm ơn bạn đã đánh giá!' : '✍️ Viết đánh giá của bạn'}
          </div>

          {submitted ? (
            <div style={{ textAlign:'center', padding:'14px 0' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
              <div style={{ fontSize:13, color:'#555', marginBottom:12 }}>Đánh giá của bạn đã được ghi nhận. Cảm ơn bạn!</div>
              <button onClick={()=>setSubmitted(false)} style={{ background:'none', border:`1.5px solid ${primary}`, color:primary, padding:'7px 18px', borderRadius:20, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Thêm đánh giá khác
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'#555', display:'block', marginBottom:4 }}>Tên của bạn *</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nguyễn Văn A" style={inputStyle} maxLength={60}
                  onFocus={e=>(e.target as HTMLInputElement).style.borderColor=primary}
                  onBlur={e=>(e.target as HTMLInputElement).style.borderColor='#e5e7eb'} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'#555', display:'block', marginBottom:6 }}>Đánh giá sao *</label>
                <StarRow value={rating} onChange={setRating} size={28} />
                {rating > 0 && (
                  <div style={{ fontSize:12, color:primary, marginTop:4, fontWeight:600 }}>
                    {['','😞 Rất tệ','😕 Tệ','😐 Bình thường','😊 Tốt','🤩 Tuyệt vời'][rating]}
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'#555', display:'block', marginBottom:4 }}>Nội dung đánh giá *</label>
                <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..." rows={3} maxLength={1000}
                  style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }}
                  onFocus={e=>(e.target as HTMLTextAreaElement).style.borderColor=primary}
                  onBlur={e=>(e.target as HTMLTextAreaElement).style.borderColor='#e5e7eb'} />
                <div style={{ fontSize:11, color:'#bbb', textAlign:'right', marginTop:2 }}>{comment.length}/1000</div>
              </div>
              {error && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#dc2626' }}>
                  ⚠️ {error}
                </div>
              )}
              <button onClick={submit} disabled={submitting}
                style={{ background:submitting?'#d1d5db':primary, color:'white', border:'none', padding:'11px 0', borderRadius:8, fontWeight:700, fontSize:14, cursor:submitting?'not-allowed':'pointer', transition:'background 0.2s', boxShadow:submitting?'none':`0 2px 10px ${primary}44` }}>
                {submitting ? '⏳ Đang gửi...' : '📤 Gửi đánh giá'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Social Links Footer helper ────────────────────────────────────────────────
// Trả về mảng social links dựa theo settings, chỉ những cái có URL và được bật
type SocialLink = { key: string; label: string; icon: string; href: string; bg: string }

function buildSocialLinks(settings: Settings): SocialLink[] {
  const all = [
    { key: 'social_facebook', label: 'Facebook', icon: 'f', bg: '#1877f2', prefix: '' },
    { key: 'social_shopee',   label: 'Shopee',   icon: '🛒', bg: '#ee4d2d', prefix: '' },
    { key: 'social_zalo',     label: 'Zalo',     icon: 'Z',  bg: '#0068ff', prefix: 'https://zalo.me/' },
    { key: 'social_tiktok',   label: 'TikTok',   icon: '♪',  bg: '#010101', prefix: '' },
    { key: 'social_youtube',  label: 'YouTube',  icon: '▶',  bg: '#ff0000', prefix: '' },
    { key: 'social_instagram',label: 'Instagram',icon: '📷', bg: '#e1306c', prefix: '' },
  ]
  return all
    .filter(s => {
      const val = settings[s.key]?.trim()
      // Nếu admin đã set show toggle = false thì ẩn
      const showKey = `${s.key}_show`
      if (settings[showKey] === 'false') return false
      return !!val
    })
    .map(s => {
      let val = settings[s.key].trim()
      // Zalo: nếu chỉ nhập SĐT thì build URL
      if (s.key === 'social_zalo' && !val.startsWith('http')) {
        val = `https://zalo.me/${val.replace(/\D/g,'')}`
      }
      if (!val.startsWith('http')) val = `https://${val}`
      return { key: s.key, label: s.label, icon: s.icon, href: val, bg: s.bg }
    })
}

// ── Share Button ──────────────────────────────────────────────────────────────
function ShareButton({ product, primary }: { product: Product; primary: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const getUrl = () => typeof window !== 'undefined' ? window.location.href : ''

  const shareZalo = () => {
    window.open(`https://zalo.me/share/url?url=${encodeURIComponent(getUrl())}&title=${encodeURIComponent(product.name)}`, '_blank')
    setOpen(false)
  }
  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getUrl())}`, '_blank', 'width=600,height=400')
    setOpen(false)
  }
  const copyLink = async () => {
    await navigator.clipboard.writeText(getUrl())
    setCopied(true); setTimeout(() => setCopied(false), 2000)
    setOpen(false)
  }
  const shareNative = async () => {
    try { await navigator.share({ title: product.name, url: getUrl() }) } catch {}
    setOpen(false)
  }

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button
        onClick={() => hasNativeShare ? shareNative() : setOpen(o => !o)}
        style={{ background:'none', border:'1px solid #e5e7eb', borderRadius:20, padding:'4px 12px', fontSize:12, color:'#666', cursor:'pointer', display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap', transition:'border-color 0.15s' }}
      >
        {copied ? '✅ Đã copy!' : '🔗 Chia sẻ'}
      </button>

      {open && !hasNativeShare && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background:'white', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', border:'1px solid #f0f0f0', minWidth:180, zIndex:999, overflow:'hidden' }}>
          <button onClick={shareFacebook} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 16px', border:'none', background:'white', cursor:'pointer', fontSize:13, color:'#1877F2', fontWeight:600, borderBottom:'1px solid #f5f5f5', textAlign:'left' }}>
            <span style={{ width:28, height:28, borderRadius:'50%', background:'#1877F2', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>f</span>
            Chia sẻ Facebook
          </button>
          <button onClick={shareZalo} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 16px', border:'none', background:'white', cursor:'pointer', fontSize:13, color:'#0068FF', fontWeight:600, borderBottom:'1px solid #f5f5f5', textAlign:'left' }}>
            <span style={{ width:28, height:28, borderRadius:'50%', background:'#0068FF', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>Zalo</span>
            Chia sẻ Zalo
          </button>
          <button onClick={copyLink} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 16px', border:'none', background:'white', cursor:'pointer', fontSize:13, color:'#555', fontWeight:500, textAlign:'left' }}>
            <span style={{ width:28, height:28, borderRadius:'50%', background:'#f0f0f0', color:'#555', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>🔗</span>
            {copied ? '✅ Đã copy!' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Social Proof Popup ────────────────────────────────────────────────────────
const NAMES = ['Nguyễn V.A','Trần T.B','Lê M.C','Phạm T.D','Hoàng V.E','Vũ T.F','Đặng V.G','Bùi T.H','Đỗ M.I','Ngô T.K','Dương V.L','Lý T.M','Phan V.N','Trịnh T.O','Đinh V.P']
const ACTIONS = ['vừa xem sản phẩm này','vừa mua sản phẩm này','vừa thêm vào giỏ hàng','vừa đặt hàng thành công']
const TIMES = ['vài giây trước','1 phút trước','2 phút trước','5 phút trước','10 phút trước']
const LOCS = ['Hà Nội','TP.HCM','Đà Nẵng','Hải Phòng','Cần Thơ','Huế','Nha Trang','Vinh','Thái Nguyên','Bình Dương']

function SocialProofPopup({ primary }: { primary: string }) {
  const [visible, setVisible] = useState(false)
  const [data, setData] = useState({ name:'', action:'', time:'', loc:'' })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

  const show = () => {
    setData({ name: pick(NAMES), action: pick(ACTIONS), time: pick(TIMES), loc: pick(LOCS) })
    setVisible(true)
    timerRef.current = setTimeout(() => setVisible(false), 4000)
  }

  useEffect(() => {
    const initial = setTimeout(show, 3000)
    const interval = setInterval(show, 12000)
    return () => { clearTimeout(initial); clearInterval(interval); if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  if (!visible) return null

  return (
    <div
      onClick={() => setVisible(false)}
      style={{
        position:'fixed', bottom:90, left:16, zIndex:9999,
        background:'white', borderRadius:12, padding:'10px 14px',
        boxShadow:'0 4px 20px rgba(0,0,0,0.12)', border:'1px solid #f0f0f0',
        display:'flex', alignItems:'center', gap:10, maxWidth:280,
        animation:'slideInLeft 0.35s ease', cursor:'pointer',
      }}
    >
      <style>{`@keyframes slideInLeft{from{transform:translateX(-120%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      <div style={{ width:36, height:36, borderRadius:'50%', background:`${primary}15`, border:`2px solid ${primary}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
        👤
      </div>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#222' }}>{data.name} <span style={{ color:'#888', fontWeight:400 }}>· {data.loc}</span></div>
        <div style={{ fontSize:12, color:'#555', marginTop:1 }}>{data.action}</div>
        <div style={{ fontSize:11, color:'#bbb', marginTop:1 }}>{data.time}</div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProductDetail({ product, related, settings={}, categories=[] }: { product:Product; related:Product[]; settings?:Settings; categories?:any[] }) {
  const [copied, setCopied] = useState(false)
  const [openReviews, setOpenReviews] = useState(false)

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
  const showReviews   = settings.show_reviews    !== 'false'
  const voucherText   = settings.voucher_text    || '15.5 VOUCHER Giam them 30%'

  const discount = product.oldPrice && product.oldPrice > product.price
    ? Math.round((1-product.price/product.oldPrice)*100) : null
  const saved = product.oldPrice && product.oldPrice > product.price
    ? product.oldPrice - product.price : null
  const { sold, views, reviews, rating } = getFakeStats(product.id)
  const images = parseImages(product.imageUrl)

  const copyLink = async () => { const url = window.location.href; if (navigator.share) { try { await navigator.share({ title: product.name, url }) } catch {} } else { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) } }

  const socialLinks = buildSocialLinks(settings)

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5', fontFamily:"'Be Vietnam Pro', Arial, sans-serif", paddingBottom:80, overflowX:'hidden' }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box}
        @media(max-width:768px){
          .pd-grid{grid-template-columns:1fr!important;display:block!important}
          .pd-gallery{border-right:none!important;border-bottom:1px solid #f5f5f5;padding:12px!important}
          .pd-info{padding:14px!important}
          .pd-price{font-size:24px!important}
          .pd-title{font-size:15px!important}
          .pd-stats{font-size:11px!important;gap:6px!important}
          .pd-policies{font-size:12px!important}
          .pd-cta{flex-direction:column!important}
          .pd-cta button{width:100%!important;flex:none!important}
        }
        img{max-width:100%;height:auto}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-33.33%)}}
      `}</style>

      {/* ── Marquee trust bar ── */}
      <MarqueeBanner primary={primary} items={[shippingText, guaranteeText, returnText, shopeeBadge]} />

      {/* ── Header ── */}
      <header style={{ background:`linear-gradient(135deg,${primary} 0%,${primary}cc 100%)`, position:'sticky', top:0, zIndex:100, boxShadow:`0 2px 16px ${primary}44` }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 16px', height:56, display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/" style={{ color:'white', fontWeight:800, fontSize:18, textDecoration:'none', display:'flex', alignItems:'center', gap:8, flexShrink:0, minWidth:0 }}>
            <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:8, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{siteEmoji}</span>
            <div style={{ overflow:'hidden', minWidth:0 }}>
              <div style={{ fontFamily:'Nunito,sans-serif', letterSpacing:'-0.5px', lineHeight:1.1, fontSize:16, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:220 }}>{siteName}</div>
              {siteTagline && <div style={{ fontSize:10, opacity:0.8, lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:220 }}>{siteTagline}</div>}
            </div>
          </Link>
          <div style={{ flex:1 }} />
          {discount && discount>=10 && (
            <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'5px 10px', flexShrink:0 }}>
              <FlashCountdown productId={product.id} />
            </div>
          )}
        </div>
        <CategoryNav categories={categories} activeCat={product.category.slug} primary={primary} />
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
          <div className="pd-grid" style={{ display:'grid', gridTemplateColumns:'min(420px,40%) 1fr' }}>

            {/* Left: Gallery */}
            <div className="pd-gallery" style={{ padding:16, borderRight:'1px solid #f5f5f5' }}>
              <ImageGallery images={images} name={product.name} primary={primary} />
              {/* Mua tại Shopee box */}
              <a href={product.affLink} target="_blank" rel="noopener noreferrer"
                onClick={()=>fetch(`/api/products/${product.id}/click`,{method:'POST'}).catch(()=>{})}
                style={{ marginTop:12, display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:`${primary}0d`, border:`1px solid ${primary}33`, borderRadius:8, cursor:'pointer', transition:'background 0.15s', textDecoration:'none' }}
                onMouseEnter={e=>(e.currentTarget as HTMLAnchorElement).style.background=`${primary}18`}
                onMouseLeave={e=>(e.currentTarget as HTMLAnchorElement).style.background=`${primary}0d`}>
                <span style={{ fontSize:22 }}>🛒</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:primary }}>Mua tại Shopee</div>
                  <div style={{ fontSize:11, color:'#888' }}>{shopeeBadge} →</div>
                </div>
              </a>
            </div>

            {/* Right: Info */}
            <div className="pd-info" style={{ padding:'20px 20px 20px', display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
              {/* Category + share */}
              <div style={{ marginBottom:8, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, color:primary, fontWeight:700, background:`${primary}12`, padding:'3px 10px', borderRadius:20, border:`1px solid ${primary}33` }}>{product.category.name}</span>
                <ShareButton product={product} primary={primary} />
              </div>

              <h1 className='pd-title' style={{ margin:'0 0 10px', fontSize:18, fontWeight:500, lineHeight:1.5, color:'#222' }}>{product.name}</h1>

              {/* Stats — kiểu Shopee */}
              <div className='pd-stats' style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, paddingBottom:12, borderBottom:'1px solid #f5f5f5', fontSize:12, color:'#666', flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <span style={{ color:'#ee4d2d', fontWeight:700, fontSize:13, borderBottom:'1px solid #ee4d2d' }}>{rating}</span>
                  <div style={{ display:'flex', gap:1 }}>
                    {[1,2,3,4,5].map(i => (
                      <span key={i} style={{ color: i <= Math.round(Number(rating)) ? '#f5a623' : '#e0e0e0', fontSize:13, lineHeight:1 }}>★</span>
                    ))}
                  </div>
                </div>
                <span style={{ color:'#e0e0e0' }}>|</span>
                <span style={{ borderBottom:'1px solid #999', color:'#555' }}>{reviews.toLocaleString('vi-VN')} Đánh Giá</span>
                <span style={{ color:'#e0e0e0' }}>|</span>
                <span>Đã Bán <b style={{ color:'#555' }}>{sold >= 1000 ? `${Math.floor(sold/100)/10}k` : sold.toLocaleString('vi-VN')}</b></span>
                <span style={{ color:'#e0e0e0' }}>|</span>
                <span style={{ color:'#26aa99', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}>
                  <span>✅</span> Còn Hàng
                </span>
              </div>

              {/* Price — kiểu Shopee với Flash Sale */}
              <div style={{ background:'#fff6f6', border:'1px solid #ffe0dc', borderRadius:8, padding:'14px 16px', marginBottom:14 }}>
                {discount && discount >= 5 && (
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, paddingBottom:10, borderBottom:'1px dashed #ffd0cc', flexWrap:'wrap' }}>
                    <div style={{ background:'linear-gradient(90deg,#d0011b,#ee4d2d)', borderRadius:3, padding:'3px 10px', display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                      <span style={{ fontSize:12 }}>⚡</span>
                      <span style={{ color:'white', fontWeight:800, fontSize:12, letterSpacing:'0.5px' }}>FLASH SALE</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:11, color:'#999' }}>KẾT THÚC TRONG</span>
                      <FlashCountdown productId={product.id} />
                    </div>
                  </div>
                )}
                <div style={{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap' }}>
                  <span className='pd-price' style={{ fontSize:28, fontWeight:700, color:'#ee4d2d', lineHeight:1 }}>
                    {product.price.toLocaleString('vi-VN')}<span style={{ fontSize:15 }}>₫</span>
                  </span>
                  {product.oldPrice && product.oldPrice > product.price && (
                    <span style={{ fontSize:14, color:'#aaa', textDecoration:'line-through' }}>
                      {product.oldPrice.toLocaleString('vi-VN')}₫
                    </span>
                  )}
                  {discount && (
                    <span style={{ background:'#ee4d2d', color:'white', fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:3 }}>
                      -{discount}%
                    </span>
                  )}
                </div>
                {saved && (
                  <div style={{ marginTop:6, fontSize:12, color:'#ee4d2d', display:'flex', alignItems:'center', gap:4 }}>
                    🎉 Tiết kiệm <b>{saved.toLocaleString('vi-VN')}₫</b> so với giá gốc
                  </div>
                )}
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
              <div className='pd-cta' style={{ display:'flex', gap:10, marginTop:'auto', flexWrap:'wrap' }}>
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

        {/* ── Đánh giá sản phẩm ── */}
        {showReviews && (
          <div style={{ background:'white', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', overflow:'hidden', marginBottom:16 }}>
            <div onClick={() => setOpenReviews(o => !o)}
              style={{ padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', userSelect:'none', background: openReviews ? `${primary}0e` : 'white', borderBottom: openReviews ? `2px solid ${primary}33` : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:20 }}>💬</span>
                <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:primary }}>ĐÁNH GIÁ SẢN PHẨM</h2>
              </div>
              <span style={{ fontSize:20, color:primary, transition:'transform 0.2s', display:'inline-block', transform: openReviews ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
            </div>
            {openReviews && <ReviewsSection productId={product.id} primary={primary} />}
          </div>
        )}

        {/* ── Sản phẩm liên quan — grid kiểu Shopee ── */}
        {related.length>0 && (
          <div style={{ background:'white', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', overflow:'hidden' }}>
            <div style={{ background:'#fafafa', padding:'14px 20px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:4, height:20, background:primary, borderRadius:2 }} />
              <h2 style={{ margin:0, fontSize:15, fontWeight:700, color:'#333' }}>CÓ THỂ BẠN THÍCH</h2>
              <span style={{ fontSize:12, color:'#aaa' }}>Top {related.length}</span>
            </div>
            <div style={{ padding:'12px 12px 16px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:1, border:'1px solid #f0f0f0', borderRadius:8, overflow:'hidden' }}>
                {related.map((p, idx) => {
                  const disc = p.oldPrice && p.oldPrice > p.price ? Math.round((1-p.price/p.oldPrice)*100) : null
                  const thumb = parseImages(p.imageUrl)[0]
                  const fakeSold = Math.floor(seededRandom(p.id*3)*9+1)
                  const fakeSoldUnit = fakeSold >= 10 ? `${fakeSold}k+` : `${fakeSold}k+`
                  const fakeRating = (seededRandom(p.id*13)*0.6+4.3).toFixed(1)
                  const isYeuThich = seededRandom(p.id*7) > 0.4
                  const isMall = seededRandom(p.id*11) > 0.6
                  return (
                    <Link key={p.id} href={`/san-pham/${p.slug}`} style={{ textDecoration:'none', display:'block' }}>
                      <div
                        style={{ background:'white', cursor:'pointer', transition:'box-shadow 0.18s', borderRight:'1px solid #f5f5f5', borderBottom:'1px solid #f5f5f5' }}
                        onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'}
                        onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.boxShadow='none'}
                      >
                        {/* Image */}
                        <div style={{ position:'relative', paddingTop:'100%', background:'#fafafa', overflow:'hidden' }}>
                          {thumb
                            ? <img src={thumb} alt={p.name} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain', padding:6, transition:'transform 0.3s' }} />
                            : <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>🛍️</div>}

                          {/* Discount badge — góc trên trái */}
                          {disc && (
                            <div style={{ position:'absolute', top:0, left:0, background:primary, color:'white', fontSize:11, fontWeight:800, padding:'3px 8px', borderRadius:'0 0 8px 0' }}>
                              -{disc}%
                            </div>
                          )}

                          {/* Voucher bar — đáy ảnh như Shopee */}
                          {voucherText && (
                            <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,0.55)', padding:'3px 6px', display:'flex', alignItems:'center', gap:4 }}>
                              <span style={{ color:'white', fontSize:9, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{voucherText}</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ padding:'8px 10px 10px' }}>
                          {/* Mall / Yêu thích badge */}
                          {(isYeuThich || isMall) && (
                            <div style={{ marginBottom:4 }}>
                              {isMall
                                ? <span style={{ background:'#d0011b', color:'white', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:2 }}>Mall</span>
                                : <span style={{ background:`${primary}15`, color:primary, fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:2, border:`1px solid ${primary}44` }}>Yêu thích</span>
                              }
                            </div>
                          )}

                          {/* Name */}
                          <div style={{ fontSize:12, color:'#333', lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', minHeight:34, marginBottom:5 }}>
                            {p.name}
                          </div>

                          {/* Price row */}
                          <div style={{ display:'flex', alignItems:'baseline', gap:5, flexWrap:'wrap', marginBottom:4 }}>
                            <span style={{ color:primary, fontWeight:700, fontSize:15 }}>{p.price.toLocaleString('vi-VN')}₫</span>
                            {p.oldPrice && p.oldPrice > p.price && (
                              <span style={{ color:'#bbb', fontSize:11, textDecoration:'line-through' }}>{p.oldPrice.toLocaleString('vi-VN')}₫</span>
                            )}
                          </div>

                          {/* Rating + Sold */}
                          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#888', flexWrap:'wrap' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:2 }}>
                              <span style={{ color:'#f5a623' }}>★</span>
                              <span style={{ color:'#555', fontWeight:600 }}>{fakeRating}</span>
                            </div>
                            <span style={{ color:'#e0e0e0' }}>|</span>
                            <span>Đã bán {fakeSoldUnit}</span>
                          </div>

                          {/* Location + Freeship */}
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:5 }}>
                            <span style={{ fontSize:10, color:'#aaa' }}>📍 Hà Nội</span>
                            <span style={{ background:'#26aa99', color:'white', fontSize:9, fontWeight:700, padding:'2px 5px', borderRadius:2 }}>FREESHIP</span>
                          </div>
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
      <footer style={{ background:footerColor, color:'#aaa', padding:'40px 20px 28px', marginTop:8 }}>
        <div style={{ maxWidth:1100, margin:'0 auto', textAlign:'center' }}>
          <div style={{ color:'white', fontWeight:800, fontSize:18, fontFamily:'Nunito,sans-serif', marginBottom:6 }}>{siteEmoji} {siteName}</div>
          <div style={{ fontSize:13, maxWidth:400, margin:'0 auto 20px', lineHeight:1.7, color:'rgba(255,255,255,0.4)' }}>{footerText}</div>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div style={{ display:'flex', justifyContent:'center', gap:10, flexWrap:'wrap', marginBottom:20 }}>
              {socialLinks.map(s => (
                <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:6, background:s.bg, color:'white', padding:'7px 14px', borderRadius:20, fontSize:12, fontWeight:700, textDecoration:'none', transition:'opacity 0.15s, transform 0.15s', opacity:0.9 }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.opacity='1';(e.currentTarget as HTMLAnchorElement).style.transform='translateY(-2px)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.opacity='0.9';(e.currentTarget as HTMLAnchorElement).style.transform=''}}>
                  <span style={{ fontSize:14 }}>{s.icon}</span>
                  {s.label}
                </a>
              ))}
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'center', gap:8, flexWrap:'wrap', marginBottom:20, padding:'0 8px' }}>
            {[shippingText, guaranteeText, returnText].map((t,i)=>(
              <span key={i} style={{ fontSize:12, color:'rgba(255,255,255,0.55)', background:'rgba(255,255,255,0.06)', padding:'6px 14px', borderRadius:20, border:'1px solid rgba(255,255,255,0.08)', textAlign:'center', lineHeight:1.5 }}>{t}</span>
            ))}
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:16, fontSize:12, color:'rgba(255,255,255,0.25)' }}>{footerCopy}</div>
        </div>
      </footer>

      {/* ── Social Proof Popup ── */}
      <SocialProofPopup primary={primary} />

      {/* ── Sticky Buy Bar mobile ── */}
      <StickyBuyBar product={product} primary={primary} buyButtonText={buyBtnText} />
    </div>
  )
}
