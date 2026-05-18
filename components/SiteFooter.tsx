import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function SiteFooter() {
  const rows = await prisma.setting.findMany()
  const s: Record<string, string> = {}
  for (const r of rows) s[r.key] = r.value

  const primary       = s.primary_color    || '#ee4d2d'
  const siteName      = s.site_name        || 'Shopee Deals'
  const siteEmoji     = s.site_logo_emoji  || '🛍️'
  const footerText    = s.footer_text      || 'Tổng hợp sản phẩm giảm giá tốt nhất từ Shopee'
  const footerCopy    = s.footer_copyright || '© 2025 · Affiliate Website'
  const footerColor   = s.footer_color     || '#1a1a1a'
  const shippingText  = s.shipping_text    || '🚚 Miễn phí vận chuyển'
  const guaranteeText = s.guarantee_text   || '✅ Hoàn tiền nếu không đúng'
  const returnText    = s.return_text      || '↩️ Đổi trả 15 ngày'

  const socialDefs = [
    { key: 'social_zalo',      label: 'Zalo',      icon: 'Z',  color: '#0068ff', getHref: (v: string) => v.startsWith('http') ? v : `https://zalo.me/${v.replace(/\D/g,'')}` },
    { key: 'social_facebook',  label: 'Facebook',  icon: 'f',  color: '#1877f2', getHref: (v: string) => v },
    { key: 'social_shopee',    label: 'Shopee',    icon: 'S',  color: '#ee4d2d', getHref: (v: string) => v },
    { key: 'social_tiktok',    label: 'TikTok',    icon: '♪',  color: '#010101', getHref: (v: string) => v },
    { key: 'social_youtube',   label: 'YouTube',   icon: '▶',  color: '#ff0000', getHref: (v: string) => v },
    { key: 'social_instagram', label: 'Instagram', icon: '📷', color: '#e1306c', getHref: (v: string) => v },
    { key: 'contact_email',    label: 'Email',     icon: '✉',  color: '#6b7280', getHref: (v: string) => `mailto:${v}` },
  ]
  const socialChannels = socialDefs
    .filter(ch => s[ch.key]?.trim() && s[`${ch.key}_show`] !== 'false')
    .map(ch => ({ ...ch, value: s[ch.key].trim() }))

  return (
    <footer style={{ background: footerColor, color: '#aaa', padding: '48px 20px 28px', marginTop: 48 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: 'white', fontWeight: 800, fontSize: 20, fontFamily: 'Nunito, sans-serif', marginBottom: 6 }}>{siteEmoji} {siteName}</div>
          <div style={{ fontSize: 13, maxWidth: 400, margin: '0 auto', lineHeight: 1.7, color: 'rgba(255,255,255,0.45)' }}>{footerText}</div>
        </div>
        {socialChannels.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            {socialChannels.map(ch => (
              <a key={ch.key} href={ch.getHref(ch.value)} target="_blank" rel="noopener noreferrer"
                style={{ width: 36, height: 36, borderRadius: '50%', background: ch.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
                {ch.icon}
              </a>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 28, padding: '0 8px' }}>
          {[shippingText, guaranteeText, returnText].map((t, i) => (
            <span key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.06)', padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', lineHeight: 1.5 }}>{t}</span>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{footerCopy}</div>
      </div>
    </footer>
  )
}
