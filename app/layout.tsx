import type { Metadata } from 'next'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import { prisma } from '@/lib/prisma'

export const revalidate = 60

async function getSiteSettings() {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ['site_name', 'seo_title', 'seo_description', 'seo_keywords', 'og_title', 'og_description', 'og_image', 'site_tagline'] } }
    })
    const s: Record<string, string> = {}
    for (const r of rows) s[r.key] = r.value
    return s
  } catch {
    return {}
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  const siteName = s.site_name || 'Shopee Deals'
  const title = s.seo_title || siteName
  const description = s.seo_description || 'San pham giam gia tot nhat tu Shopee'
  const ogTitle = s.og_title || title
  const ogDescription = s.og_description || description

  const ogImage = s.og_image || undefined

  return {
    title,
    description,
    keywords: s.seo_keywords || 'shopee, deal, giam gia',
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      siteName,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: ogTitle,
      description: ogDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <ThemeProvider />
      </head>
      <body>{children}</body>
    </html>
  )
}
