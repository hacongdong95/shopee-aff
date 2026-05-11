import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ReviewActions from './ReviewActions'

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { name: true, slug: true } } },
  })

  const total   = reviews.length
  const visible = reviews.filter(r => !r.isHidden).length
  const hidden  = reviews.filter(r => r.isHidden).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>💬 Bình luận sản phẩm</h2>
        <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
          <span style={{ background: '#f0fdf4', color: '#059669', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>✅ Hiện: {visible}</span>
          <span style={{ background: '#fef2f2', color: '#dc2626', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>🙈 Ẩn: {hidden}</span>
          <span style={{ background: '#f5f5f5', color: '#555', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>Tổng: {total}</span>
        </div>
      </div>

      {reviews.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>
          Chưa có bình luận nào
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reviews.map(r => (
          <div key={r.id} className="card" style={{
            padding: 16,
            borderLeft: `4px solid ${r.isHidden ? '#e5e7eb' : '#ee4d2d'}`,
            opacity: r.isHidden ? 0.6 : 1,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</span>
                  <span style={{ color: '#f5a623' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <span style={{ fontSize: 12, color: '#e74c3c', fontWeight: 600 }}>❤️ {r.likes}</span>
                  {r.isHidden && <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>Đã ẩn</span>}
                  <span style={{ fontSize: 11, color: '#aaa' }}>
                    {new Date(r.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <Link href={`/san-pham/${r.product.slug}`} target="_blank" style={{ fontSize: 12, color: '#ee4d2d', textDecoration: 'none', display: 'block', marginBottom: 6 }}>
                  📦 Sản phẩm: {r.product.name}
                </Link>
                <p style={{ margin: 0, fontSize: 14, color: '#333', lineHeight: 1.6 }}>{r.comment}</p>
              </div>
              <ReviewActions id={r.id} isHidden={r.isHidden} comment={r.comment} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
