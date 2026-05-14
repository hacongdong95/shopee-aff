import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import ScrollReveal from '@/components/ScrollReveal'
import SortFilter from '@/components/SortFilter'
import FlashSaleCountdown from '@/components/FlashSaleCountdown'
import PopupAd from '@/components/PopupAd'
import BackToTop from '@/components/BackToTop'

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
  const siteEmoji       = settings.site_logo_emoji  || '\u{1F6CD}\uFE0F'
  const bannerShow      = settings.banner_show      !== 'false'
  const bannerImage     = settings.banner_image     || ''
  const bannerLink      = settings.banner_link      || ''
  const bannerTitle     = settings.banner_title     || '\uD83D\uDD25 Deal Hot M\u1ED7i Ng\u00E0y'
  const bannerSubtitle  = settings.banner_subtitle  || 'Hàng ngàn sản phẩm giảm giá sâu'
  const footerText      = settings.footer_text      || 'Tổng hợp sản phẩm giảm giá tốt nhất'
  const footerCopyright = settings.footer_copyright || '\u00A9 2025 \u00B7 Affiliate Website'
  const footerColor     = settings.footer_color     || '#1a1a1a'
  const shippingText    = settings.shipping_text    || '\uD83D\uDE9A Miễn phí vận chuyển'
  const guaranteeText   = settings.guarantee_text   || '\u2705 Hoàn tiền nếu không đúng'
  const returnText      = settings.return_text      || '\u21A9\uFE0F Đổi trả 15 ngày'
  const activeCatName   = catSlug ? categories.find(c => c.slug === catSlug)?.name : null
  const popupShow       = settings.popup_show     === 'true'
  const popupImage      = settings.popup_image    || ''
  const popupAffLink    = settings.popup_aff_link || ''
  const popupTitle      = settings.popup_title    || ''
  const popupSubtitle   = settings.popup_subtitle || ''
  const popupBtnText    = settings.popup_btn_text || 'Mua Ngay'
  const popupDelay      = Number(settings.popup_delay || '2')
  const flashSaleEnd    = settings.flash_sale_end_time || ''
  const flashSaleText   = 'Giá cực hời, săn ngay!'

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      <div className="trust-bar" style={{ background: 'white', borderBottom: '1px solid #eee', padding: '9px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap' }}>
          {[shippingText, guaranteeText, returnText].map((t, i) => (
            <span key={i} style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>{t}</span>
          ))}
        </div>
      </div>

      {!catSlug && !query && <FlashSaleCountdown primary={primary} />}

      {bannerShow && !catSlug && !query && (
        bannerImage && (
          bannerLink ? (
            <a href={bannerLink} style={{ display: 'block', width: '100%', lineHeight: 0 }}>
              <img src={bannerImage} alt={bannerTitle} style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
            </a>
          ) : (
            <div style={{ width: '100%', lineHeight: 0 }}>
              <img src={bannerImage} alt={bannerTitle} style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
            </div>
          )
        )
      )}

      <div id="products" style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 16px' }}>
        {hotProducts.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 4, height: 24, background: primary, borderRadius: 2 }} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>🔥 Bán Chạy Nhất</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
              {hotProducts.map((p, i) => (
                <ScrollReveal key={p.id} delay={i * 50}>
                  <ProductCard product={p as any} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        )}

        <SortFilter currentSort={sort} currentMin={minPrice} currentMax={maxPrice} catSlug={catSlug} query={query} primary={primary} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {products.map((p, i) => (
            <ScrollReveal key={p.id} delay={Math.min(i % 6 * 60, 300)}>
              <ProductCard product={p as any} />
            </ScrollReveal>
          ))}
        </div>
      </div>

      {popupShow && popupImage && popupAffLink && (
        <PopupAd imageUrl={popupImage} affLink={popupAffLink} title={popupTitle} subtitle={popupSubtitle} btnText={popupBtnText} primary={primary} delaySeconds={popupDelay} />
      )}

      <BackToTop primary={primary} />

      <footer style={{ background: footerColor, color: '#aaa', padding: '48px 20px 28px', marginTop: 48 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ color: 'white', fontWeight: 800, fontSize: 20, marginBottom: 6 }}>{siteEmoji} {siteName}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 20 }}>{footerCopyright}</div>
        </div>
      </footer>
    </div>
  )
}