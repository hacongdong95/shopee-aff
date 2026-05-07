import type { Metadata } from 'next'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'Shopee Affiliate',
  description: 'Sản phẩm giảm giá tốt nhất từ Shopee',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <ThemeProvider />
      </head>
      <body>{children}</body>
    </html>
  )
}