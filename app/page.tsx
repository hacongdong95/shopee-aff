import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import ScrollReveal from '@/components/ScrollReveal'
import SortFilter from '@/components/SortFilter'
import FlashSaleCountdown from '@/components/FlashSaleCountdown'
import PopupAd from '@/components/PopupAd'
import BannerCarousel from '@/components/BannerCarousel'
import ProductGrid from '@/components/ProductGrid'

export const revalidate = 60

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

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* TRUST BAR */}
      <div style={{ background: 'white', borderBottom: '1px solid #eee', padding: '7px 16px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[shippingText, guaranteeText, returnText].map((t, i) => (
            <span key={i} style={{ fontSize: 11, color: '#555', fontWeight: 500, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: i < 2 ? 6 : 0 }}>
              {t}
              {i < 2 && <span style={{ color: '#ddd', marginLeft: 6 }}>|</span>}
            </span>
          ))}
        </div>
      </div>

      {/* FLASH SALE */}
      {!catSlug && !query && <FlashSaleCountdown primary={primary} />}

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

      {/* FOOTER */}
      <footer style={{ background: footerColor, color: '#aaa', padding: '48px 20px 28px', marginTop: 48 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 20, fontFamily: 'Nunito, sans-serif', marginBottom: 6 }}>{siteEmoji} {siteName}</div>
            <div style={{ fontSize: 13, maxWidth: 400, margin: '0 auto', lineHeight: 1.7, color: 'rgba(255,255,255,0.45)' }}>{footerText}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 28, padding: '0 8px' }}>
            {[shippingText, guaranteeText, returnText].map((t, i) => (
              <span key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.06)', padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', lineHeight: 1.5 }}>{t}</span>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{footerCopyright}</div>
        </div>
      </footer>
    </div>
  )
}
