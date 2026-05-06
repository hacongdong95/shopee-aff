import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shopee Affiliate',
  description: 'Sản phẩm giảm giá tốt nhất từ Shopee',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
