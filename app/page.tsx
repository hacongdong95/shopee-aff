import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import ScrollReveal from '@/components/ScrollReveal'
import SortFilter from '@/components/SortFilter'
import FlashSaleCountdown from '@/components/FlashSaleCountdown'
import PopupAd from '@/components/PopupAd'
import BannerCarousel from '@/components/BannerCarousel'
import ProductGrid from '@/components/ProductGrid'
import FOMOToast from '@/components/FOMOToast'

export const revalidate = 0

async function getSettings() {
  const rows = await prisma.setting.findMany()
  const s: Record<string, string> = {}
  for (const row of rows) s[row.key] = row.value
  return s
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string; sort?: string; minPrice?: string; maxPrice?: string }>
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
  const siteEmoji       = settings.site_logo_emoji  || '🛍️'
  const siteTagline     = settings.site_tagline     || ''
  const bannerShow      = settings.banner_show      !== 'false'
  const bannerTitle     = settings.banner_title     || '🔥 Deal Hot Mỗi Ngày'
  const bannerSubtitle  = settings.banner_subtitle  || 'Hàng ngàn sản phẩm giảm giá sâu'
  const footerText      = settings.footer_text      || 'Tổng hợp sản phẩm giảm giá tốt nhất'
  const footerCopyright = settings.footer_copyright || '© 2025 · Affiliate Website'
  const footerColor     = settings.footer_color     || '#1a1a1a'
  const shippingText    = settings.shipping_text    || '🚚 Miễn phí vận chuyển'
  const guaranteeText   = settings.guarantee_text   || '✅ Hoàn tiền nếu không đúng'
  const returnText      = settings.return_text      || '↩️ Đổi trả 15 ngày'
  const activeCatName   = catSlug ? categories.find(c => c.slug === catSlug)?.name : null
  const popupShow     = settings.popup_show     === 'true'
  const popupImage    = settings.popup_image    || ''
  const popupAffLink  = settings.popup_aff_link || ''
  const popupTitle    = settings.popup_title    || ''
  const popupSubtitle = settings.popup_subtitle || ''
  const popupBtnText  = settings.popup_btn_text || 'Mua Ngay'
  const popupDelay    = Number(settings.popup_delay || '2')
  const bannerImage   = settings.banner_image   || ''
  const bannerLink    = settings.banner_link    || ''
  // Hỗ trợ nhiều ảnh banner — mỗi dòng 1 URL
  const bannerImages  = bannerImage ? bannerImage.split('\n').map((u: string) => u.trim()).filter(Boolean) : []
  const bannerLinks   = bannerLink  ? bannerLink.split('\n').map((u: string) => u.trim())                  : []

  // Social / Contact cho floating buttons & footer
  const zaloValue    = settings.social_zalo?.trim()    || ''
  const phoneValue   = settings.contact_phone?.trim()  || settings.social_zalo?.trim() || ''
  const fbValue      = settings.social_facebook?.trim() || ''
  const zaloShow     = settings.social_zalo_show     !== 'false' && !!zaloValue
  const phoneShow    = settings.contact_phone_show   !== 'false' && !!phoneValue
  const fbShow       = settings.social_facebook_show !== 'false' && !!fbValue
  const zaloHref     = zaloValue.startsWith('http') ? zaloValue : `https://zalo.me/${zaloValue.replace(/\D/g,'')}`
  const phoneHref    = phoneValue.startsWith('http') ? phoneValue : `tel:${phoneValue.replace(/\s/g,'')}`
  const socialChannels = [
    { key: 'social_zalo',      label: 'Zalo',      icon: 'Z',  color: '#0068ff', getHref: (v: string) => v.startsWith('http') ? v : `https://zalo.me/${v.replace(/\D/g,'')}` },
    { key: 'social_facebook',  label: 'Facebook',  icon: 'f',  color: '#1877f2', getHref: (v: string) => v },
    { key: 'social_shopee',    label: 'Shopee',    icon: 'S',  color: '#ee4d2d', getHref: (v: string) => v },
    { key: 'social_tiktok',    label: 'TikTok',    icon: '♪',  color: '#010101', getHref: (v: string) => v },
    { key: 'social_youtube',   label: 'YouTube',   icon: '▶',  color: '#ff0000', getHref: (v: string) => v },
    { key: 'social_instagram', label: 'Instagram', icon: '📷', color: '#e1306c', getHref: (v: string) => v },
    { key: 'contact_email',    label: 'Email',     icon: '✉',  color: '#6b7280', getHref: (v: string) => `mailto:${v}` },
  ].filter(ch => settings[ch.key]?.trim() && settings[`${ch.key}_show`] !== 'false')
    .map(ch => ({ ...ch, value: settings[ch.key].trim() }))

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* ── TRUST BAR chạy chữ ── */}
      <div style={{ borderBottom: '1px solid #eee', background: 'white' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ background: `linear-gradient(90deg, ${primary}11, white, ${primary}11)`, padding: '8px 0', overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative' }}>
        <div style={{ display: 'inline-flex', animation: 'marquee 25s linear infinite', gap: 0 }}>
          {[...Array(4)].map((_, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
              {[shippingText, guaranteeText, returnText].map((t, j) => (
                <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#444', fontWeight: 500, padding: '0 24px' }}>
                  <span style={{ color: primary, fontSize: 10 }}>◆</span>
                  {t}
                </span>
              ))}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-25%); }
          }
        `}</style>
      </div>
      </div>
      </div>

      {/* FLASH SALE */}
      {!catSlug && !query && (
        <div style={{ maxWidth: 1200, margin: '0 auto', overflow: 'hidden' }}>
          <FlashSaleCountdown primary={primary} />
        </div>
      )}

      {/* BANNER */}
      {bannerShow && !catSlug && !query && (
        bannerImages.length > 0 ? (
          <BannerCarousel images={bannerImages} links={bannerLinks} primary={primary} />
        ) : (
          <div style={{ maxWidth: 1200, margin: '12px auto', padding: '0 16px' }}>
            <div style={{ background: `linear-gradient(135deg, ${primary}ee 0%, ${primary} 50%, ${primary}cc 100%)`, padding: '40px 20px', textAlign: 'center', color: 'white', position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -30, left: 40, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
              <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
                <div style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, fontFamily: 'Nunito, sans-serif', marginBottom: 10, textShadow: '0 2px 12px rgba(0,0,0,0.15)', letterSpacing: '-0.5px' }}>{bannerTitle}</div>
                <div style={{ fontSize: 15, opacity: 0.9, maxWidth: 480, margin: '0 auto 20px' }}>{bannerSubtitle}</div>
                <Link href="#products" style={{ display: 'inline-block', background: 'white', color: primary, padding: '11px 28px', borderRadius: 24, fontWeight: 800, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                  Xem ưu đãi ngay ↓
                </Link>
              </div>
            </div>
          </div>
        )
      )}

      <div id="products" style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 16px' }}>

        {/* HOT PRODUCTS */}
        {hotProducts.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 4, height: 24, background: primary, borderRadius: 2 }} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>🔥 Bán Chạy Nhất</span>
              <span style={{ fontSize: 12, color: '#888', background: '#f0f0f0', padding: '2px 10px', borderRadius: 20 }}>Top {hotProducts.length}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
              {hotProducts.map((p, i) => (
                <ScrollReveal key={p.id} delay={i * 50}>
                  <ProductCard product={p} />
                </ScrollReveal>
              ))}
            </div>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #e0e0e0, transparent)', margin: '32px 0 0' }} />
          </div>
        )}

        {/* SORT FILTER */}
        <SortFilter currentSort={sort} currentMin={minPrice} currentMax={maxPrice} catSlug={catSlug} query={query} primary={primary} />

        {/* Result bar */}
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
          </ScrollReveal>
        ) : (
          <ProductGrid products={products} primary={primary} />
        )}
      </div>

      {/* POPUP */}
      {popupShow && popupImage && popupAffLink && (
        <PopupAd imageUrl={popupImage} affLink={popupAffLink} title={popupTitle} subtitle={popupSubtitle} btnText={popupBtnText} primary={primary} delaySeconds={popupDelay} />
      )}

      {/* FOMO — số người xem + toast vừa mua */}
      <FOMOToast
        products={products.slice(0, 20).map(p => ({ id: p.id, name: p.name, price: p.price }))}
        primary={primary}
      />

      {/* ── FLOATING CONTACT BUTTONS ── */}
      {(zaloShow || phoneShow || fbShow) && (
        <>
          <style>{`
            @keyframes fb-pulse {
              0%,100% { transform: scale(1); }
              50%      { transform: scale(1.08); }
            }
            @keyframes fb-ripple {
              0%   { transform: scale(0.8); opacity: 0.7; }
              100% { transform: scale(2.4); opacity: 0; }
            }
            @keyframes fb-ripple2 {
              0%   { transform: scale(0.8); opacity: 0.5; }
              100% { transform: scale(2.4); opacity: 0; }
            }
            .fb-btn { animation: fb-pulse 2s ease-in-out infinite; position: relative; }
            .fb-ring1 {
              position: absolute; inset: -6px; border-radius: 50%;
              animation: fb-ripple 2s ease-out infinite;
              pointer-events: none;
            }
            .fb-ring2 {
              position: absolute; inset: -6px; border-radius: 50%;
              animation: fb-ripple2 2s ease-out infinite 0.7s;
              pointer-events: none;
            }
            .fb-label {
              position: absolute; right: 62px; top: 50%;
              transform: translateY(-50%);
              background: rgba(20,20,20,0.85); color: white;
              font-size: 12px; font-weight: 700; white-space: nowrap;
              padding: 5px 12px; border-radius: 20px;
              opacity: 0; pointer-events: none; transition: opacity 0.2s;
              backdrop-filter: blur(4px);
            }
            .fb-wrap:hover .fb-label { opacity: 1; }
          `}</style>
          <div style={{
            position: 'fixed', right: 16, bottom: 90, zIndex: 9999,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14,
          }}>
            {/* Zalo */}
            {zaloShow && (
              <div className="fb-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span className="fb-label">💬 Chat Zalo</span>
                <a href={zaloHref} target="_blank" rel="noopener noreferrer"
                  className="fb-btn"
                  style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'linear-gradient(145deg, #0e8aff, #0055cc)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none',
                    boxShadow: '0 6px 24px rgba(0,104,255,0.55), 0 2px 8px rgba(0,0,0,0.2)',
                    animationDelay: '0s',
                  }}>
                  <div className="fb-ring1" style={{ background: 'rgba(0,104,255,0.3)' }} />
                  <div className="fb-ring2" style={{ background: 'rgba(0,104,255,0.2)' }} />
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                    <text x="15" y="22" textAnchor="middle" fill="white" fontSize="20" fontWeight="900" fontFamily="Arial, sans-serif">Z</text>
                  </svg>
                </a>
              </div>
            )}

            {/* Phone */}
            {phoneShow && (
              <div className="fb-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span className="fb-label">📞 Gọi ngay</span>
                <a href={phoneHref}
                  className="fb-btn"
                  style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'linear-gradient(145deg, #2ecc71, #16a34a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none',
                    boxShadow: '0 6px 24px rgba(34,197,94,0.55), 0 2px 8px rgba(0,0,0,0.2)',
                    animationDelay: '0.6s',
                  }}>
                  <div className="fb-ring1" style={{ background: 'rgba(34,197,94,0.3)' }} />
                  <div className="fb-ring2" style={{ background: 'rgba(34,197,94,0.2)' }} />
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.58.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.6 21 3 13.4 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.23 1.01L6.6 10.8z"/>
                  </svg>
                </a>
              </div>
            )}

            {/* Facebook */}
            {fbShow && (
              <div className="fb-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span className="fb-label">👍 Facebook</span>
                <a href={fbValue} target="_blank" rel="noopener noreferrer"
                  className="fb-btn"
                  style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'linear-gradient(145deg, #2d8af6, #0a5dc9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none',
                    boxShadow: '0 6px 24px rgba(24,119,242,0.55), 0 2px 8px rgba(0,0,0,0.2)',
                    animationDelay: '1.2s',
                  }}>
                  <div className="fb-ring1" style={{ background: 'rgba(24,119,242,0.3)' }} />
                  <div className="fb-ring2" style={{ background: 'rgba(24,119,242,0.2)' }} />
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                  </svg>
                </a>
              </div>
            )}
          </div>
        </>
      )}

      {/* FOOTER */}
      <footer style={{ background: footerColor, padding: '40px 16px 28px', marginTop: 48 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Logo + mô tả */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ background: primary, borderRadius: 12, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{siteEmoji}</div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>{siteName}</div>
              {siteTagline && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{siteTagline}</div>}
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7, marginBottom: 20 }}>{footerText}</div>

          {/* Trust pills — wrap tự nhiên mobile */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {[shippingText, guaranteeText, returnText].map((t, i) => (
              <span key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.07)', padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>{t}</span>
            ))}
          </div>

          {/* BCT + Shopee badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            <div style={{ background: 'white', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ background: '#d32f2f', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontSize: 13, fontWeight: 900 }}>✓</span>
              </div>
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#d32f2f', textTransform: 'uppercase' }}>Đã đăng ký</div>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>Bộ Công Thương</div>
              </div>
            </div>
            <div style={{ background: primary, borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🛒</span>
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Official</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>Shopee</div>
              </div>
            </div>
          </div>

          {/* Social icons */}
          {socialChannels.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {socialChannels.map(ch => (
                <a key={ch.key} href={ch.getHref(ch.value)} target="_blank" rel="noopener noreferrer"
                  title={ch.label}
                  style={{
                    width: 36, height: 36, borderRadius: 9, background: ch.color,
                    color: 'white', fontWeight: 800, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none', boxShadow: `0 2px 8px ${ch.color}55`,
                  }}>
                  {ch.icon}
                </a>
              ))}
            </div>
          )}

          {/* Divider + copyright */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{footerCopyright}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>Website affiliate — giá & KM có thể thay đổi</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
