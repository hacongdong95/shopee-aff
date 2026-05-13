'use client'

import Link from 'next/link'
import SearchBox from './SearchBox'
import CategoryNav from './CategoryNav'
import { usePathname } from 'next/navigation'

export default function Header({ settings, categories }: { settings: any, categories: any }) {
  const pathname = usePathname()
  
  if (pathname.startsWith('/admin')) return null

  const primary     = settings.primary_color    || '#ee4d2d'
  const siteName    = settings.site_name        || 'Shopee Deals'
  const siteEmoji   = settings.site_logo_emoji  || '🛍️'
  const siteTagline = settings.site_tagline     || ''

  return (
    <header style={{ 
      background: `linear-gradient(135deg, ${primary} 0%, ${primary}bb 100%)`, 
      position: 'sticky', 
      top: 0, 
      zIndex: 100, 
      boxShadow: `0 2px 20px ${primary}44` 
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', gap: 20 }}>
        <Link href="/" style={{ color: 'white', fontWeight: 800, fontSize: 20, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <span style={{ 
            background: 'rgba(255,255,255,0.22)', 
            backdropFilter: 'blur(4px)', 
            borderRadius: 10, 
            width: 40, 
            height: 40, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: 22, 
            flexShrink: 0, 
            border: '1px solid rgba(255,255,255,0.3)' 
          }}>{siteEmoji}</span>
          <div>
            <div style={{ fontFamily: 'Nunito, sans-serif', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{siteName}</div>
            {siteTagline && <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.75, lineHeight: 1 }}>{siteTagline}</div>}
          </div>
        </Link>
        <SearchBox primary={primary} />
      </div>
      <CategoryNav categories={categories} primary={primary} />
    </header>
  )
}
