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

  const siteName        = settings.site_name        || 'Shopee Deals'
  const siteEmoji       = settings.site_logo_emoji  || '🛍️'
  const siteTagline     = settings.site_tagline     || ''
  const footerText      = settings.footer_text      || 'Tổng hợp sản phẩm giảm giá tốt nhất từ Shopee'
  const footerCopyright = settings.footer_copyright || '© 2026 · No Copyright'
  const footerColor     = settings.footer_color     || '#1a1a1a'
  const shippingText    = settings.shipping_text    || '🚚 Miễn phí vận chuyển · Giao trong 1-3 ngày'
  const guaranteeText   = settings.guarantee_text   || '✅ Hoàn tiền nếu hàng không đúng mô tả'
  const returnText      = settings.return_text      || '↩️ Đổi trả miễn phí trong 15 ngày'

  const socialChannels = [
    { key: 'social_zalo',      label: 'Zalo',      icon: 'Z',  color: '#0068ff', getHref: (v: string) => v.startsWith('http') ? v : `https://zalo.me/${v.replace(/\D/g,'')}` },
    { key: 'social_facebook',  label: 'Facebook',  icon: 'f',  color: '#1877f2', getHref: (v: string) => v.startsWith('http') ? v : `https://${v}` },
    { key: 'social_shopee',    label: 'Shopee',    icon: '🛒', color: '#ee4d2d', getHref: (v: string) => v.startsWith('http') ? v : `https://${v}` },
    { key: 'social_tiktok',    label: 'TikTok',    icon: '♪',  color: '#010101', getHref: (v: string) => v.startsWith('http') ? v : `https://${v}` },
    { key: 'social_youtube',   label: 'YouTube',   icon: '▶',  color: '#ff0000', getHref: (v: string) => v.startsWith('http') ? v : `https://${v}` },
    { key: 'social_instagram', label: 'Instagram', icon: '📷', color: '#e1306c', getHref: (v: string) => v.startsWith('http') ? v : `https://${v}` },
    { key: 'contact_email',    label: 'Email',     icon: '✉',  color: '#6b7280', getHref: (v: string) => `mailto:${v}` },
  ].filter(ch => settings[ch.key]?.trim() && settings[`${ch.key}_show`] !== 'false')
   .map(ch => ({ ...ch, value: settings[ch.key].trim() }))

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

        {/* ── FOOTER CHUNG ── */}
        <footer style={{ background: footerColor, marginTop: 0 }}>

          {/* Top accent line */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${primary}, ${primary}88, transparent)` }} />

          {/* Main content */}
          <div style={{ padding: '40px 16px 0' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 36, marginBottom: 36 }}>

                {/* Cột 1: Brand + About */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc)`, borderRadius: 14, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, boxShadow: `0 4px 12px ${primary}44` }}>
                      {siteEmoji}
                    </div>
                    <div>
                      <div style={{ color: 'white', fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{siteName}</div>
                      {siteTagline && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{siteTagline}</div>}
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, margin: '0 0 16px' }}>
                    {settings.footer_about || footerText}
                  </p>
                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ background: '#d32f2f', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: 'white', fontSize: 10, fontWeight: 900 }}>✓</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 8, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', lineHeight: 1.2 }}>Đã đăng ký</div>
                        <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Bộ Công Thương</div>
                      </div>
                    </div>
                    <div style={{ background: `${primary}22`, border: `1px solid ${primary}44`, borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16 }}>🛒</span>
                      <div>
                        <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', lineHeight: 1.2 }}>Official</div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>Shopee</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cột 2: Cam kết */}
                <div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 3, height: 16, background: primary, borderRadius: 2, display: 'inline-block' }} />
                    Cam kết của chúng tôi
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[shippingText, guaranteeText, returnText].map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '9px 12px' }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{t.split(' ')[0]}</span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>{t.replace(/^[\S]+\s/, '')}</span>
                      </div>
                    ))}
                  </div>
                  {settings.footer_shopee_url && (
                    <a href={settings.footer_shopee_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, background: `${primary}22`, border: `1px solid ${primary}55`, borderRadius: 10, padding: '10px 14px', textDecoration: 'none' }}>
                      <span style={{ fontSize: 20 }}>🛒</span>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Mua hàng chính hãng tại</div>
                        <div style={{ fontSize: 13, color: 'white', fontWeight: 800 }}>Shop Shopee của chúng tôi →</div>
                      </div>
                    </a>
                  )}
                </div>

                {/* Cột 3: Liên hệ + Social */}
                <div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 3, height: 16, background: primary, borderRadius: 2, display: 'inline-block' }} />
                    Liên hệ & Theo dõi
                  </div>

                  {settings.footer_hotline && (
                    <a href={`tel:${settings.footer_hotline.replace(/\s/g, '')}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '10px 14px', textDecoration: 'none', marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📞</div>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Hotline hỗ trợ</div>
                        <div style={{ fontSize: 14, color: 'white', fontWeight: 800 }}>{settings.footer_hotline}</div>
                      </div>
                    </a>
                  )}

                  {settings.footer_email && (
                    <a href={`mailto:${settings.footer_email}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', textDecoration: 'none', marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✉️</div>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Email liên hệ</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{settings.footer_email}</div>
                      </div>
                    </a>
                  )}

                  {settings.footer_address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📍</div>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Địa chỉ</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{settings.footer_address}</div>
                      </div>
                    </div>
                  )}

                  {settings.footer_fanpage_url && (
                    <a href={settings.footer_fanpage_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #1877f2, #0a5dc9)', borderRadius: 10, padding: '12px 14px', textDecoration: 'none', marginBottom: 14, boxShadow: '0 4px 16px rgba(24,119,242,0.35)' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Theo dõi Fanpage</div>
                        <div style={{ fontSize: 13, color: 'white', fontWeight: 800 }}>{settings.footer_fanpage_label || siteName}</div>
                      </div>
                      <div style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 10px', borderRadius: 20, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        👍 Theo dõi
                      </div>
                    </a>
                  )}

                  {socialChannels.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kênh khác</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {socialChannels.map((ch: any) => (
                          <a key={ch.key} href={ch.getHref(ch.value)} target="_blank" rel="noopener noreferrer" title={ch.label}
                            style={{ width: 38, height: 38, borderRadius: 10, background: ch.color, color: 'white', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', boxShadow: `0 2px 8px ${ch.color}55` }}>
                            {ch.icon}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '16px 16px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{footerCopyright}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>Website affiliate — giá & KM có thể thay đổi</div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
