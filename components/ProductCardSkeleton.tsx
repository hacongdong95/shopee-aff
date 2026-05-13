'use client'

export default function ProductCardSkeleton() {
  return (
    <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -400px 0 }
          100% { background-position: 400px 0 }
        }
        .skeleton-box {
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 800px 100%;
          animation: shimmer 1.4s ease-in-out infinite;
          border-radius: 6px;
        }
      `}</style>

      {/* Image placeholder */}
      <div className="skeleton-box" style={{ paddingTop: '100%', position: 'relative', borderRadius: 0 }} />

      {/* Info */}
      <div style={{ padding: '12px 13px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Category tag */}
        <div className="skeleton-box" style={{ height: 18, width: '40%', borderRadius: 20 }} />
        {/* Name lines */}
        <div className="skeleton-box" style={{ height: 14, width: '100%' }} />
        <div className="skeleton-box" style={{ height: 14, width: '75%' }} />
        {/* Price box */}
        <div className="skeleton-box" style={{ height: 56, width: '100%', borderRadius: 8 }} />
        {/* Stock bar */}
        <div className="skeleton-box" style={{ height: 20, width: '100%' }} />
        {/* CTA */}
        <div className="skeleton-box" style={{ height: 38, width: '100%', borderRadius: 9 }} />
      </div>
    </div>
  )
}

// Grid skeleton — dùng khi load trang chủ
export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
