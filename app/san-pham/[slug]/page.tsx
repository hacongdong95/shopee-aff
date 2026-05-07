import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BuyButton from '@/components/BuyButton'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  })

  if (!product || !product.isActive) notFound()

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, isActive: true, NOT: { id: product.id } },
    include: { category: true },
    take: 6,
  })

  const discount = product.oldPrice && product.oldPrice > product.price
    ? Math.round((1 - product.price / product.oldPrice) * 100) : null
  const saved = product.oldPrice && product.oldPrice > product.price
    ? product.oldPrice - product.price : null

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#ee4d2d,#ff7337)', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', gap: 20, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(238,77,45,0.35)' }}>
        <Link href="/" style={{ color: 'white', fontWeight: 800, fontSize: 20, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🛍️</span> Shopee Deals
        </Link>
      </header>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '10px 16px', fontSize: 13, color: '#888', display: 'flex', gap: 6, alignItems: 'center' }}>
        <Link href="/" style={{ color: '#ee4d2d', textDecoration: 'none' }}>Trang chủ</Link>
        <span>›</span>
        <Link href={`/?cat=${product.category.slug}`} style={{ color: '#ee4d2d', textDecoration: 'none' }}>{product.category.name}</Link>
        <span>›</span>
        <span style={{ color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{product.name}</span>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 40px' }}>

        {/* Main product box */}
        <div style={{ background: 'white', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', minHeight: 500 }}>

            {/* Left: Image */}
            <div style={{ padding: 20, borderRight: '1px solid #f0f0f0' }}>
              <div 
                  onClick={() => document.getElementById('product-description')?.scrollIntoView({ behavior: 'smooth' })}
                  style={{ width: '100%', paddingTop: '100%', position: 'relative', background: '#fafafa', borderRadius: 4, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, color: '#ddd' }}>🛍️</div>
                )}
              </div>

              {/* Shopee badge */}
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#fff9f8', border: '1px solid #ffd5cb', borderRadius: 4 }}>
                <span style={{ fontSize: 20 }}>🛒</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ee4d2d' }}>Mua tại Shopee</div>
                  <div style={{ fontSize: 11, color: '#888' }}>Đảm bảo chính hãng · Giao nhanh</div>
                </div>
              </div>
            </div>

            {/* Right: Info */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 0 }}>

              {/* Category tag */}
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#ee4d2d', fontWeight: 700, background: '#fff0ee', padding: '3px 10px', borderRadius: 20, border: '1px solid #ffd5cb' }}>
                  {product.category.name}
                </span>
              </div>

              {/* Title */}
              <h1 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 400, lineHeight: 1.5, color: '#333' }}>
                {product.name}
              </h1>

              {/* Stats row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0', fontSize: 13, color: '#555' }}>
                <span style={{ color: '#ee4d2d', fontWeight: 600 }}>⭐ 4.8</span>
                <span style={{ color: '#ccc' }}>|</span>
                <span>{product.clicks} Đã Xem</span>
                <span style={{ color: '#ccc' }}>|</span>
                <span style={{ color: product.isActive ? '#26aa99' : '#dc2626', fontWeight: 600 }}>
                  {product.isActive ? 'Còn Hàng' : 'Hết Hàng'}
                </span>
              </div>

              {/* Price box */}
              <div style={{ background: '#fafafa', padding: '16px 20px', marginBottom: 16, borderRadius: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: '#ee4d2d' }}>
                    {product.price.toLocaleString('vi-VN')}₫
                  </span>
                  {product.oldPrice && product.oldPrice > product.price && (
                    <>
                      <span style={{ fontSize: 16, color: '#999', textDecoration: 'line-through' }}>
                        {product.oldPrice.toLocaleString('vi-VN')}₫
                      </span>
                      {discount && (
                        <span style={{ background: '#ee4d2d', color: 'white', fontSize: 13, fontWeight: 700, padding: '2px 8px', borderRadius: 2 }}>
                          -{discount}%
                        </span>
                      )}
                    </>
                  )}
                </div>
                {saved && (
                  <div style={{ marginTop: 6, fontSize: 13, color: '#26aa99' }}>
                    🎉 Tiết kiệm {saved.toLocaleString('vi-VN')}₫
                  </div>
                )}
              </div>

              {/* Shipping info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, fontSize: 13 }}>
                {[
                  ['Vận Chuyển', '🚚 Miễn phí vận chuyển · Giao trong 2-5 ngày'],
                  ['Đảm Bảo', '✅ Hoàn tiền nếu hàng không đúng mô tả'],
                  ['Trả Hàng', '↩️ Đổi trả miễn phí trong 15 ngày'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: 0 }}>
                    <span style={{ color: '#888', minWidth: 110 }}>{label}</span>
                    <span style={{ color: '#333' }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                <BuyButton productId={product.id} affLink={product.affLink} variant="outline" label="Thêm Vào Giỏ Hàng" />
                <BuyButton productId={product.id} affLink={product.affLink} variant="primary" label="Mua Ngay" />
              </div>

              <div style={{ marginTop: 12, fontSize: 12, color: '#aaa' }}>
                Bạn sẽ được chuyển đến Shopee để hoàn tất đặt hàng an toàn
              </div>
            </div>
          </div>
        </div>

        {/* Description box */}
        {product.description && (
          <div id="product-description" style={{ background: 'white', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', marginBottom: 12, overflow: 'hidden' }}>
            <div style={{ background: '#fafafa', padding: '14px 20px', borderBottom: '1px solid #f0f0f0' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: '#333' }}>MÔ TẢ SẢN PHẨM</h2>
            </div>
            <div style={{ padding: '20px 24px', fontSize: 14, color: '#444', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {product.description}
            </div>
          </div>
        )}

        {/* Related products */}
        {related.length > 0 && (
          <div style={{ background: 'white', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ background: '#fafafa', padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 20, background: '#ee4d2d', borderRadius: 2 }} />
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: '#333' }}>CÓ THỂ BẠN THÍCH</h2>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {related.map(p => {
                  const disc = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : null
                  return (
                    <Link key={p.id} href={`/san-pham/${p.slug}`} style={{ textDecoration: 'none' }}>
                      <div style={{ border: '1px solid #f0f0f0', borderRadius: 4, overflow: 'hidden', transition: 'box-shadow 0.2s', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'}
                        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'}
                      >
                        <div style={{ position: 'relative', paddingTop: '100%', background: '#fafafa' }}>
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                            : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🛍️</div>
                          }
                          {disc && <div style={{ position: 'absolute', top: 0, left: 0, background: '#ee4d2d', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 6px' }}>-{disc}%</div>}
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          <div style={{ fontSize: 12, color: '#333', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 32 }}>{p.name}</div>
                          <div style={{ marginTop: 6, color: '#ee4d2d', fontWeight: 700, fontSize: 14 }}>{p.price.toLocaleString('vi-VN')}₫</div>
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
