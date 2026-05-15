'use client'

import { useState, useEffect, useCallback } from 'react'

type Props = {
  images: string[]   // mảng URL ảnh
  links?: string[]   // mảng link tương ứng (tuỳ chọn)
  primary: string
}

export default function BannerCarousel({ images, links = [], primary }: Props) {
  const [cur, setCur] = useState(0)
  const [paused, setPaused] = useState(false)

  const total = images.length
  const prev = useCallback(() => setCur(c => (c - 1 + total) % total), [total])
  const next = useCallback(() => setCur(c => (c + 1) % total), [total])

  // Auto-slide mỗi 4 giây
  useEffect(() => {
    if (total <= 1 || paused) return
    const t = setInterval(next, 4000)
    return () => clearInterval(t)
  }, [total, paused, next])

  if (total === 0) return null

  const img = images[cur]
  const link = links[cur] || ''

  return (
    <div
      style={{ maxWidth: 1200, margin: '12px auto', padding: '0 16px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}>

        {/* Ảnh banner */}
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
            <img
              key={cur}
              src={img}
              alt={`Banner ${cur + 1}`}
              style={{ width: '100%', height: 'clamp(120px, 25vw, 280px)', objectFit: 'cover', display: 'block', transition: 'opacity 0.3s' }}
            />
          </a>
        ) : (
          <img
            key={cur}
            src={img}
            alt={`Banner ${cur + 1}`}
            style={{ width: '100%', height: 'clamp(120px, 25vw, 280px)', objectFit: 'cover', display: 'block', transition: 'opacity 0.3s' }}
          />
        )}

        {/* Nút prev/next — chỉ hiện khi có nhiều ảnh */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: 'white', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', transition: 'background 0.2s', zIndex: 2 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.4)')}
            >‹</button>
            <button
              onClick={next}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: 'white', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', transition: 'background 0.2s', zIndex: 2 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.4)')}
            >›</button>
          </>
        )}

        {/* Dots */}
        {total > 1 && (
          <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6, zIndex: 2 }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCur(i)}
                style={{ width: i === cur ? 20 : 8, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', background: i === cur ? 'white' : 'rgba(255,255,255,0.5)', padding: 0, transition: 'all 0.3s' }}
              />
            ))}
          </div>
        )}

        {/* Counter nhỏ góc phải */}
        {total > 1 && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.45)', color: 'white', fontSize: 11, padding: '2px 8px', borderRadius: 10, backdropFilter: 'blur(4px)' }}>
            {cur + 1}/{total}
          </div>
        )}
      </div>
    </div>
  )
}
