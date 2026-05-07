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

import ThemeProvider from '@/components/ThemeProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <ThemeProvider />   {/* ← thêm dòng này */}
      </head>
      <body>{children}</body>
    </html>
  )
}