'use client'

import { useEffect, useState } from 'react'

const NAMES = [
  'Nguyễn Thị Lan', 'Trần Văn Minh', 'Lê Thị Hoa', 'Phạm Văn Nam',
  'Hoàng Thị Mai', 'Vũ Văn Hùng', 'Đặng Thị Thu', 'Bùi Văn Đức',
  'Đỗ Thị Linh', 'Ngô Văn Tuấn', 'Trịnh Thị Nga', 'Đinh Văn Khoa',
  'Lý Thị Phương', 'Phan Văn Tài', 'Mai Thị Hạnh', 'Tô Văn Long',
  'Hồ Văn Bình', 'Lâm Thị Cúc', 'Võ Văn Thắng', 'Trương Thị Yến',
]

const LOCATIONS = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Huế', 'Nha Trang', 'Biên Hoà']

const ACTIONS = ['vừa mua', 'vừa đặt hàng', 'vừa xem xong và mua']

type Product = { id: number; name: string; price: number }

export default function FOMOToast({
  products,
  primary = '#ee4d2d',
}: {
  products: Product[]
  primary?: string
}) {
  const [toast, setToast] = useState<{ name: string; location: string; action: string; product: Product } | null>(null)
  const [visible, setVisible] = useState(false)
  const [viewers, setViewers] = useState(0)

  // Số người đang xem — random 20-80, thay đổi mỗi 15s
  useEffect(() => {
    const update = () => setViewers(Math.floor(Math.random() * 60 + 20))
    update()
    const interval = setInterval(update, 15000)
    return () => clearInterval(interval)
  }, [])

  // Toast popup mỗi 25-40 giây
  useEffect(() => {
    if (products.length === 0) return

    const show = () => {
      const name     = NAMES[Math.floor(Math.random() * NAMES.length)]
      const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]
      const action   = ACTIONS[Math.floor(Math.random() * ACTIONS.length)]
      const product  = products[Math.floor(Math.random() * products.length)]
      setToast({ name, location, action, product })
      setVisible(true)
      // Ẩn sau 5 giây
      setTimeout(() => setVisible(false), 5000)
    }

    // Hiện lần đầu sau 8 giây
    const first = setTimeout(show, 8000)
    // Sau đó lặp mỗi 30-45 giây
    const interval = setInterval(show, Math.random() * 15000 + 30000)
    return () => { clearTimeout(first); clearInterval(interval) }
  }, [products])

  return (
    <>
      {/* ── Số người đang xem trang ── */}
      {viewers > 0 && (
        <div style={{
          position: 'fixed', bottom: 80, right: 16, zIndex: 998,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          color: 'white', borderRadius: 20, padding: '6px 14px',
          fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: '#2ecc71',
            display: 'inline-block', flexShrink: 0,
            boxShadow: '0 0 0 3px rgba(46,204,113,0.3)',
            animation: 'fomoPulse 1.5s infinite',
          }} />
          {viewers} người đang xem trang này
        </div>
      )}

      {/* ── Toast "vừa mua" ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 120, left: 16, zIndex: 999,
          background: 'white', borderRadius: 12, padding: '12px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: `1.5px solid ${primary}22`,
          maxWidth: 300, minWidth: 240,
          transform: visible ? 'translateX(0)' : 'translateX(-120%)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          {/* Avatar */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${primary}, ${primary}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: 15,
          }}>
            {toast.name.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>
              {toast.name} <span style={{ color: '#888', fontWeight: 400 }}>({toast.location})</span>
            </div>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>
              {toast.action}{' '}
              <span style={{ fontWeight: 700, color: primary }}>
                {toast.product.name.length > 30
                  ? toast.product.name.slice(0, 30) + '...'
                  : toast.product.name}
              </span>
            </div>
            <div style={{ fontSize: 11, color: primary, fontWeight: 700 }}>
              {toast.product.price.toLocaleString('vi-VN')}đ
            </div>
          </div>
          {/* Nút đóng */}
          <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
      )}

      <style>{`
        @keyframes fomoPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(46,204,113,0.3); }
          50%       { box-shadow: 0 0 0 6px rgba(46,204,113,0.1); }
        }
      `}</style>
    </>
  )
}
