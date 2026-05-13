import Link from 'next/link'
import { prisma } from '@/lib/prisma'

async function getSettings() {
  const rows = await prisma.setting.findMany()
  const s: Record<string, string> = {}
  for (const row of rows) s[row.key] = row.value
  return s
}

export default async function NotFound() {
  const settings   = await getSettings()
  const primary    = settings.primary_color   || '#ee4d2d'
  const siteName   = settings.site_name       || 'Shopee Deals'
  const siteEmoji  = settings.site_logo_emoji || '🛍️'

  // Lấy vài sản phẩm gợi ý
  const suggestions = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { clicks: 'desc' },
    take: 4,
    include: { category: true },
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: "'Be Vietnam Pro', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .not-found-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
      `}</style>

      {/* Header nhỏ */}
      <header style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}bb 100%)`, padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', boxShadow: `0 2px 20px ${primary}44` }}>
        <Link href="/" style={{ color: 'white', fontWeight: 800, fontSize: 18, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{siteEmoji}</span>
          {siteName}
        </Link>
      </header>

      {/* Main 404 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', textAlign: 'center' }}>

        {/* Số 404 animated */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <div style={{ fontSize: 'clamp(80px, 20vw, 140px)', fontWeight: 900, fontFamily: 'Nunito, sans-serif', lineHeight: 1, letterSpacing: '-4px', background: `linear-gradient(135deg, ${primary}, ${primary}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            404
          </div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 'clamp(40px, 10vw, 64px)', pointerEvents: 'none' }}>
            🔍
          </div>
        </div>

        <h1 style={{ fontSize: 'clamp(18px, 4vw, 26px)', fontWeight: 800, color: '#1a1a1a', margin: '0 0 10px' }}>
          Oops! Trang không tồn tại
        </h1>
        <p style={{ fontSize: 14, color: '#888', margin: '0 0 32px', maxWidth: 380, lineHeight: 1.7 }}>
          Trang bạn tìm kiếm có thể đã bị xoá, đổi tên hoặc tạm thời không khả dụng.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
          <Link href="/" style={{ background: primary, color: 'white', padding: '12px 28px', borderRadius: 24, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: `0 4px 16px ${primary}44`, display: 'flex', alignItems: 'center', gap: 8 }}>
            🏠 Về trang chủ
          </Link>
          <Link href="/?sort=popular" style={{ background: 'white', color: primary, padding: '12px 28px', borderRadius: 24, fontWeight: 700, fontSize: 14, textDecoration: 'none', border: `2px solid ${primary}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            🔥 Xem deal hot
          </Link>
        </div>

        {/* Gợi ý sản phẩm */}
        {suggestions.length > 0 && (
          <div style={{ width: '100%', maxWidth: 860 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#444', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ width: 3, height: 18, background: primary, borderRadius: 2, display: 'inline-block' }} />
              Có thể bạn thích
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {suggestions.map(p => {
                const images = p.imageUrl ? p.imageUrl.split('\n').map((u: string) => u.trim()).filter(Boolean) : []
                const thumb  = images[0] || null
                const disc   = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : null
                return (
                  <Link key={p.id} href={`/san-pham/${p.slug}`} style={{ textDecoration: 'none' }} className="not-found-card-link">
                    <div className="not-found-card" style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.05)', transition: 'transform 0.15s, box-shadow 0.15s' }}>
                      <div style={{ position: 'relative', paddingTop: '100%', background: '#f8f8f8' }}>
                        {thumb
                          ? <img src={thumb} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🛍️</div>
                        }
                        {disc && <div style={{ position: 'absolute', top: 8, left: 8, background: primary, color: 'white', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20 }}>-{disc}%</div>}
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ fontSize: 12, color: '#333', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 34, marginBottom: 6 }}>{p.name}</div>
                        <div style={{ color: primary, fontWeight: 800, fontSize: 15 }}>{p.price.toLocaleString('vi-VN')}₫</div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer nhỏ */}
      <footer style={{ background: '#1a1a1a', padding: '16px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          {siteEmoji} {siteName} · <Link href="/" style={{ color: primary, textDecoration: 'none' }}>Về trang chủ</Link>
        </div>
      </footer>
    </div>
  )
}
