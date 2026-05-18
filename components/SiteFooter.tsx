import { prisma } from '@/lib/prisma'

export default async function SiteFooter() {
  const rows = await prisma.setting.findMany()
  const s: Record<string, string> = {}
  for (const r of rows) s[r.key] = r.value

  const siteName        = s.site_name        || 'Shopee Deals'
  const siteEmoji       = s.site_logo_emoji  || '🛍️'
  const footerText      = s.footer_text      || 'Tổng hợp sản phẩm giảm giá tốt nhất từ Shopee'
  const footerCopy      = s.footer_copyright || '© 2025 · Affiliate Website'
  const footerColor     = s.footer_color     || '#1a1a1a'
  const footerAbout     = s.footer_about     || ''
  const footerHotline   = s.footer_hotline   || ''
  const footerEmail     = s.footer_email     || ''
  const footerAddress   = s.footer_address   || ''
  const footerFanpage   = s.footer_fanpage_url   || ''
  const footerFanpageLabel = s.footer_fanpage_label || 'Theo dõi Fanpage'
  const footerShopeeUrl = s.footer_shopee_url || ''
  const shippingText    = s.shipping_text    || '🚚 Miễn phí vận chuyển'
  const guaranteeText   = s.guarantee_text   || '✅ Hoàn tiền nếu không đúng'
  const returnText      = s.return_text      || '↩️ Đổi trả 15 ngày'

  const socialDefs = [
    { key: 'social_zalo',      icon: 'Z',  color: '#0068ff', getHref: (v: string) => v.startsWith('http') ? v : `https://zalo.me/${v.replace(/\D/g,'')}` },
    { key: 'social_facebook',  icon: 'f',  color: '#1877f2', getHref: (v: string) => v },
    { key: 'social_shopee',    icon: 'S',  color: '#ee4d2d', getHref: (v: string) => v },
    { key: 'social_tiktok',    icon: '♪',  color: '#010101', getHref: (v: string) => v },
    { key: 'social_youtube',   icon: '▶',  color: '#ff0000', getHref: (v: string) => v },
    { key: 'social_instagram', icon: '📷', color: '#e1306c', getHref: (v: string) => v },
    { key: 'contact_email',    icon: '✉',  color: '#6b7280', getHref: (v: string) => `mailto:${v}` },
  ]
  const socialChannels = socialDefs
    .filter(ch => s[ch.key]?.trim() && s[`${ch.key}_show`] !== 'false')
    .map(ch => ({ ...ch, value: s[ch.key].trim() }))

  const hasContact = footerHotline || footerEmail || footerAddress || footerFanpage || footerShopeeUrl

  return (
    <footer style={{ background: footerColor, color: 'rgba(255,255,255,0.55)', marginTop: 48 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 20px 0' }}>

        {/* Grid 3 cột */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 36, marginBottom: 36 }}>

          {/* Cột 1: Logo + giới thiệu + social */}
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 20, fontFamily: 'Nunito, sans-serif', marginBottom: 10 }}>
              {siteEmoji} {siteName}
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.8, color: 'rgba(255,255,255,0.45)', margin: '0 0 16px' }}>
              {footerAbout || footerText}
            </p>
            {socialChannels.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {socialChannels.map(ch => (
                  <a key={ch.key} href={ch.getHref(ch.value)} target="_blank" rel="noopener noreferrer"
                    style={{ width: 36, height: 36, borderRadius: '50%', background: ch.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, textDecoration: 'none', flexShrink: 0 }}>
                    {ch.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Cột 2: Liên hệ */}
          {hasContact && (
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Liên hệ
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {footerHotline && (
                  <a href={`tel:${footerHotline.replace(/\s/g,'')}`} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>📞</span> {footerHotline}
                  </a>
                )}
                {footerEmail && (
                  <a href={`mailto:${footerEmail}`} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>✉️</span> {footerEmail}
                  </a>
                )}
                {footerAddress && (
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span>📍</span> {footerAddress}
                  </div>
                )}
                {footerFanpage && (
                  <a href={footerFanpage} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1877f2', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', marginTop: 4 }}>
                    👍 {footerFanpageLabel}
                  </a>
                )}
                {footerShopeeUrl && (
                  <a href={footerShopeeUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#ee4d2d', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', marginTop: 4 }}>
                    🛒 Vào Shop Shopee
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Cột 3: Cam kết + thanh toán */}
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Cam kết
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {[shippingText, guaranteeText, returnText].map((t, i) => (
                <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {t}
                </div>
              ))}
            </div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Thanh toán
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['VISA', 'MC', 'MoMo', 'ZaloPay', 'VNPay', 'COD'].map(p => (
                <span key={p} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 4 }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
        {footerCopy}
      </div>
    </footer>
  )
}
