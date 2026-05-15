import type { Metadata } from 'next'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import Header from '@/components/Header'
import Effects from '@/components/Effects'
import { prisma } from '@/lib/prisma'

export const revalidate = 60

async function getSiteData() {
  try {
    const [settingsRows, categories] = await Promise.all([
      prisma.setting.findMany(),
      prisma.category.findMany({
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      })
    ])
    const settings: Record<string, string> = {}
    for (const r of settingsRows) settings[r.key] = r.value
    return { settings, categories }
  } catch (error) {
    console.error("Layout data error:", error)
    return { settings: {}, categories: [] }
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { settings: s } = await getSiteData()
  const siteName = s.site_name || 'Shopee Deals'
  const title = s.seo_title || siteName
  return {
    title,
    description: s.seo_description || 'Sản phẩm tốt nhất',
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings, categories } = await getSiteData()
  const primary     = settings.primary_color  || '#ee4d2d'
  const marqueeText = settings.marquee_text   || ''

  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <ThemeProvider />
      </head>
      <body style={{ margin: 0, background: '#f5f5f5' }}>
        <Effects
          marqueeText={marqueeText}
          primary={primary}
          floatPhone={settings.float_phone}
          floatZalo={settings.float_zalo}
          floatFacebook={settings.float_facebook}
          floatPhoneShow={settings.float_phone_show}
          floatZaloShow={settings.float_zalo_show}
          floatFacebookShow={settings.float_facebook_show}
        />
        <Header settings={settings} categories={categories} />
        {children}
      </body>
    </html>
  )
}
