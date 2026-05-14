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
        ...(catSlug ? { category: { slug: catSlug } } : {}),
        ...(query ? { name: { contains: query, mode: 'insensitive' } } : {}),
        ...(minPrice || maxPrice ? {
          price: {
            ...(minPrice ? { gte: minPrice } : {}),
            ...(maxPrice ? { lte: maxPrice } : {}),
          }
        } : {}),
      },
      include: { category: true },
      orderBy: 
        sort === 'price_asc' ? { price: 'asc' } :
        sort === 'price_desc' ? { price: 'desc' } :
        { createdAt: 'desc' }
    }),
    getSettings()
  ])

  const primary = settings.primaryColor || '#ee4d2d'
  const siteName = settings.siteName || 'Shopee'
  const siteEmoji = settings.siteEmoji || '🛍️'
  
  const bannerImg = settings.bannerImage
  const flashSaleEnd = settings.flashSaleEndTime
  const flashSaleText = settings.flashSaleText || 'Giá cực hời, săn ngay!'
  
  const popupShow = settings.popupActive === 'true'
  const popupImage = settings.popupImage
  const popupAffLink = settings.popupAffLink
  const popupTitle = settings.popupTitle
  const popupSubtitle = settings.popupSubtitle
  const popupBtnText = settings.popupBtnText
  const popupDelay = Number(settings.popupDelay) || 2

  const footerColor = settings.footerBackground || '#1a1a1a'
  const footerText = settings.footerText || 'Bản quyền thuộc về chúng tôi'
  const shippingText = settings.shippingText || 'Vận chuyển nhanh'
  const guaranteeText = settings.guaranteeText || 'Chính hãng 100%'
  const returnText = settings.returnText || 'Trả hàng dễ dàng'

  const hotProducts = [...allProducts]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10)

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      
      {/* HEADER ĐÃ GỠ BỎ ĐỂ DÙNG LAYOUT TỔNG */}

      <div className="trust-bar" style={{ background: 'white', borderBottom: '1px solid #eee', padding: '9px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 15, overflowX: 'auto' }} className="hide-scrollbar">
          {[
            { icon: '🚚', title: 'Hỏa Tốc', sub: 'Giao trong 2h' },
            { icon: '🛡️', title: 'Chính Hãng', sub: 'Bảo hành 12th' },
            { icon: '🎁', title: 'Voucher', sub: 'Giảm tới 50%' },
            { icon: '⭐', title: 'Đánh Giá', sub: 'Từ khách hàng' }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>{item.title}</div>
                <div style={{ fontSize: 10, color: '#999' }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 15px' }}>
        {bannerImg && (
          <div style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
            <img src={bannerImg} alt="Banner" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
        )}

        {flashSaleEnd && (
          <div style={{ marginBottom: 24, background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ background: `linear-gradient(90deg, ${primary}, #ff8a6c)`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={{ color: 'white', margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: 0.5 }}>⚡ FLASH SALE</h2>
                <div style={{ background: 'rgba(255,255,255,0.2)', height: 20, width: 1 }}></div>
                <span style={{ color: 'white', fontSize: 13, opacity: 0.9 }}>{flashSaleText}</span>
              </div>
              <FlashSaleCountdown endTime={flashSaleEnd} />
            </div>
          </div>
        )}

        {hotProducts.length > 0 && !catSlug && !query && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              🔥 Sản phẩm bán chạy nhất
            </h2>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 10 }} className="hide-scrollbar">
              {hotProducts.map(p => (
                <div key={p.id} style={{ width: 180, flexShrink: 0 }}>
                  <ProductCard product={p as any} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', mdDirection: 'row' as any, gap: 24 }}>
          <aside style={{ width: '100%', mdWidth: '240px' as any, flexShrink: 0 }}>
            <SortFilter categories={categories} activeCat={catSlug} primaryColor={primary} />
          </aside>

          <main style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {allProducts.map((p) => (
                <ScrollReveal key={p.id}>
                  <ProductCard product={p as any} />
                </ScrollReveal>
              ))}
            </div>

            {allProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: 12, color: '#999' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <p>Không tìm thấy sản phẩm phù hợp yêu cầu của bạn.</p>
                <Link href="/" style={{ color: primary, fontWeight: 600, textDecoration: 'none' }}>Quay lại trang chủ</Link>
              </div>
            )}
          </main>
        </div>
      </div>

      {popupShow && popupImage && popupAffLink && (
        <PopupAd imageUrl={popupImage} affLink={popupAffLink} title={popupTitle} subtitle={popupSubtitle} btnText={popupBtnText} primary={primary} delaySeconds={popupDelay} />
      )}

      <BackToTop primary={primary} />

      <footer style={{ background: footerColor, color: '#aaa', padding: '48px 20px 28px', marginTop: 48 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 20, fontFamily: 'Nunito, sans-serif', marginBottom: 6 }}>{siteEmoji} {siteName}</div>
            <div style={{ fontSize: 13, maxWidth: 400, margin: '0 auto', lineHeight: 1.7, color: 'rgba(255,255,255,0.45)' }}>{footerText}</div>
          </div>
          {/* ... Phần còn lại của Footer ... */}
        </div>
      </footer>
    </div>
  )
}