import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'

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
  searchParams: Promise<{ cat?: string; q?: string }>
}) {
  const params = await searchParams
  const catSlug = params.cat
  const query = params.q

  const [categories, products, settings] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(catSlug ? { category: { slug: catSlug } } : {}),
        ...(query ? { name: { contains: query, mode: 'insensitive' } } : {}),
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    }),
    getSettings(),
  ])

  const siteName = settings.site_name || 'Shopee Deals'
  const siteEmoji = settings.site_logo_emoji || '🛍️'
  const bannerShow = settings.banner_show !== 'false'
  const bannerTitle = settings.banner_title || '🔥 Deal Hot Mỗi Ngày'
  const bannerSubtitle = settings.banner_subtitle || 'Hàng ngàn sản phẩm giảm giá sâu — mua ngay kẻo hết!'
  const footerText = settings.footer_text || 'Tổng hợp sản phẩm giảm giá tốt nhất từ Shopee'
  const footerCopyright = settings.footer_copyright || '© 2025 · Affiliate Website'
  const activeCatName = catSlug ? categories.find(c => c.slug === catSlug)?.name : null

  // ← Lấy màu từ settings thay vì hardcode
  const primary = settings.primary_color || '#ee4d2d'

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* Header */}
      <header style={{
        background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)`,
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: `0 2px 12px ${primary}55`,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/" style={{ color: 'white', fontWeight: 800, fontSize: 22, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 26 }}>{siteEmoji}</span>
            <span style={{ fontFamily: 'Nunito, sans-serif', letterSpacing: '-0.5px' }}>{siteName}</span>
          </Link>
          <form method="GET" action="/" style={{ flex: 1, maxWidth: 560, position: 'relative' }}>
            <input
              name="q"
              defaultValue={query}
              placeholder="Tìm kiếm sản phẩm giảm giá..."
              style={{
                width: '100%', padding: '11px 48px 11px 18px',
                borderRadius: 24, border: 'none', fontSize: 14,
                outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                boxSizing: 'border-box',
              }}
            />
            <button type="submit" style={{
              position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
              background: primary, border: 'none', borderRadius: 20,
              width: 36, height: 36, cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>🔍</button>
          </form>
        </div>

        {/* Category tabs */}
        <div style={{ background: 'rgba(0,0,0,0.12)', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[{ name: 'Tất cả', slug: undefined }, ...categories].map(c => {
              const active = c.slug ? catSlug === c.slug : !catSlug
              return (
                <Link key={c.slug || 'all'} href={c.slug ? `/?cat=${c.slug}` : '/'} style={{
                  padding: '10px 18px',
                  color: active ? primary : 'rgba(255,255,255,0.9)',
                  fontWeight: active ? 700 : 500, fontSize: 13, textDecoration: 'none',
                  borderBottom: active ? '3px solid white' : '3px solid transparent',
                  background: active ? 'white' : 'transparent',
                  borderRadius: active ? '6px 6px 0 0' : 0,
                  whiteSpace: 'nowrap', transition: 'all 0.15s', display: 'block',
                }}>
                  {c.name}
                </Link>
              )
            })}
          </div>
        </div>
      </header>

      {/* Banner */}
      {bannerShow && !catSlug && !query && (
        <div style={{
          background: `linear-gradient(135deg, ${primary}dd 0%, ${primary} 50%, ${primary}bb 100%)`,
          padding: '32px 20px', textAlign: 'center', color: 'white',
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Nunito, sans-serif', marginBottom: 6 }}>
              {bannerTitle}
            </div>
            <div style={{ fontSize: 15, opacity: 0.9 }}>{bannerSubtitle}</div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 14, color: '#555' }}>
            {query ? (
              <>Kết quả tìm kiếm "<b style={{ color: primary }}>{query}</b>" — <b>{products.length}</b> sản phẩm</>
            ) : activeCatName ? (
              <><b>{activeCatName}</b> — <b>{products.length}</b> sản phẩm</>
            ) : (
              <>Tất cả sản phẩm — <b>{products.length}</b> sản phẩm</>
            )}
          </div>
          {(query || catSlug) && (
            <Link href="/" style={{ fontSize: 13, color: primary, textDecoration: 'none', fontWeight: 600 }}>✕ Xóa bộ lọc</Link>
          )}
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#999' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Không tìm thấy sản phẩm</div>
            <Link href="/" style={{ background: primary, color: 'white', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
              Xem tất cả sản phẩm
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background: '#222', color: '#aaa', padding: '32px 20px', marginTop: 40, textAlign: 'center', fontSize: 13 }}>
        <div style={{ color: 'white', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{siteEmoji} {siteName}</div>
        <div>{footerText}</div>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>{footerCopyright}</div>
      </footer>
    </div>
  )
}
