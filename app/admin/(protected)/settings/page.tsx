'use client'

import { useEffect, useState, useRef } from 'react'

type Settings = Record<string, string>

// â”€â”€â”€ Color Palettes gá»£i Ã½ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PALETTES = [
  { name: 'Shopee Cam',   color: '#ee4d2d' },
  { name: 'TÃ­m HoÃ ng gia', color: '#7c3aed' },
  { name: 'Xanh Navy',    color: '#1d4ed8' },
  { name: 'Xanh LÃ¡',      color: '#059669' },
  { name: 'Há»“ng Hot',     color: '#db2777' },
  { name: 'Cam VÃ ng',     color: '#d97706' },
  { name: 'Äá» Ruby',      color: '#dc2626' },
  { name: 'Xanh Cyan',    color: '#0891b2' },
  { name: 'Äen Thanh lá»‹ch', color: '#1f2937' },
]

// â”€â”€â”€ Tabs config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TABS = [
  { id: 'giaodien',   label: 'ðŸŽ¨ Giao diá»‡n' },
  { id: 'banner',     label: 'ðŸ“¢ Banner' },
  { id: 'noidung',    label: 'ðŸ“ Ná»™i dung' },
  { id: 'chinh_sach', label: 'ðŸ“‹ ChÃ­nh sÃ¡ch' },
  { id: 'mang_xa_hoi',label: 'ðŸ“± Máº¡ng XH' },
  { id: 'danh_gia',   label: 'ðŸ’¬ ÄÃ¡nh giÃ¡' },
  { id: 'seo',        label: 'ðŸ” SEO' },
  { id: 'popup',      label: 'ðŸŽ¯ Popup QC' },
]

// â”€â”€â”€ Fields theo tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TAB_FIELDS: Record<string, { key: string; label: string; type: string; placeholder: string; hint?: string }[]> = {
  giaodien: [
    { key: 'primary_color',   label: 'MÃ u chá»§ Ä‘áº¡o',      type: 'color',  placeholder: '#ee4d2d', hint: 'Ãp dá»¥ng cho header, nÃºt, giÃ¡ sáº£n pháº©m...' },
    { key: 'footer_color',    label: 'MÃ u ná»n footer',    type: 'color',  placeholder: '#1a1a1a', hint: 'NÃªn dÃ¹ng mÃ u tá»‘i' },
    { key: 'bg_color',        label: 'MÃ u ná»n trang',     type: 'color',  placeholder: '#f5f5f5', hint: 'MÃ u background chÃ­nh' },
    { key: 'site_logo_emoji', label: 'Logo (emoji)',       type: 'text',   placeholder: 'ðŸ›ï¸',   hint: 'Hiá»ƒn thá»‹ á»Ÿ header vÃ  footer' },
    { key: 'grid_size',       label: 'KÃ­ch thÆ°á»›c card sáº£n pháº©m', type: 'select_grid', placeholder: '180' },
  ],
  banner: [
    { key: 'banner_show',       label: 'Hiá»‡n banner trang chá»§',  type: 'toggle',   placeholder: 'true' },
    { key: 'banner_title',      label: 'TiÃªu Ä‘á» banner',         type: 'text',     placeholder: 'ðŸ”¥ Deal Hot Má»—i NgÃ y' },
    { key: 'banner_subtitle',   label: 'MÃ´ táº£ banner',           type: 'textarea', placeholder: 'HÃ ng ngÃ n sáº£n pháº©m giáº£m giÃ¡ sÃ¢u...' },
    { key: 'banner_cta_text',   label: 'Text nÃºt CTA (tÃ¹y chá»n)', type: 'text',    placeholder: 'Xem ngay' },
    { key: 'banner_cta_link',   label: 'Link nÃºt CTA',           type: 'text',     placeholder: '/?cat=dien-tu' },
    { key: 'announcement_show', label: 'Hiá»‡n thÃ´ng bÃ¡o ná»•i',     type: 'toggle',   placeholder: 'false' },
    { key: 'announcement_text', label: 'Ná»™i dung thÃ´ng bÃ¡o',     type: 'text',     placeholder: 'ðŸŽ‰ Miá»…n phÃ­ váº­n chuyá»ƒn cho Ä‘Æ¡n tá»« 200k!' },
    { key: 'announcement_color',label: 'MÃ u thÃ´ng bÃ¡o',          type: 'color',    placeholder: '#059669' },
  ],
  noidung: [
    { key: 'site_name',        label: 'TÃªn website',        type: 'text',     placeholder: 'Shopee Deals' },
    { key: 'site_tagline',     label: 'Slogan',             type: 'text',     placeholder: 'Deal hot má»—i ngÃ y' },
    { key: 'buy_button_text',  label: 'Text nÃºt Mua Ngay',  type: 'text',     placeholder: 'Mua Ngay' },
    { key: 'shopee_badge',     label: 'Badge Shopee',        type: 'text',     placeholder: 'Äáº£m báº£o chÃ­nh hÃ£ng Â· Giao nhanh' },
    { key: 'footer_text',      label: 'MÃ´ táº£ footer',       type: 'textarea', placeholder: 'Tá»•ng há»£p sáº£n pháº©m giáº£m giÃ¡...' },
    { key: 'footer_copyright', label: 'Copyright',          type: 'text',     placeholder: 'Â© 2025 Â· Affiliate Website' },
  ],
  chinh_sach: [
    { key: 'shipping_text',    label: 'Váº­n chuyá»ƒn',   type: 'text',   placeholder: 'ðŸšš Miá»…n phÃ­ váº­n chuyá»ƒn Â· Giao trong 2-5 ngÃ y' },
    { key: 'guarantee_text',   label: 'Äáº£m báº£o',     type: 'text',   placeholder: 'âœ… HoÃ n tiá»n náº¿u hÃ ng khÃ´ng Ä‘Ãºng mÃ´ táº£' },
    { key: 'return_text',      label: 'Äá»•i tráº£',      type: 'text',   placeholder: 'â†©ï¸ Äá»•i tráº£ miá»…n phÃ­ trong 15 ngÃ y' },
    { key: 'voucher_text',      label: 'Text Voucher (VD: 15.5 VOUCHER Giáº£m thÃªim 30%)', type: 'text', placeholder: '15.5 VOUCHER Giáº£m thÃªim 30%', hint: 'Hiá»ƒn á»Ÿ áº£nh sáº£n pháº©m liÃªn quan' },
    { key: 'show_fake_stats',  label: 'Hiá»‡n lÆ°á»£t xem & Ä‘Ã£ bÃ¡n giáº£', type: 'toggle', placeholder: 'true', hint: 'Táº¡o Ä‘á»™ tin tÆ°á»Ÿng cho khÃ¡ch hÃ ng' },
    { key: 'show_related',     label: 'Hiá»‡n sáº£n pháº©m liÃªn quan', type: 'toggle', placeholder: 'true' },
  ],
  // Tab máº¡ng XH: má»—i máº¡ng cÃ³ URL + toggle show/hide
  mang_xa_hoi: [], // Render riÃªng bÃªn dÆ°á»›i
  danh_gia: [
    { key: 'show_reviews', label: 'Hiá»‡n section Ä‘Ã¡nh giÃ¡ sáº£n pháº©m', type: 'toggle', placeholder: 'true', hint: 'Cho phÃ©p ngÆ°á»i dÃ¹ng xem vÃ  gá»­i Ä‘Ã¡nh giÃ¡ trÃªn trang sáº£n pháº©m' },
  ],
  popup: [
    { key: 'popup_show',     label: 'Báº­t popup quáº£ng cÃ¡o', type: 'toggle',   placeholder: 'false', hint: 'Popup xuáº¥t hiá»‡n sau vÃ i giÃ¢y khi khÃ¡ch vÃ o trang' },
    { key: 'popup_image',    label: 'Link áº£nh popup',       type: 'text',     placeholder: 'https://...jpg', hint: 'áº¢nh sáº£n pháº©m muá»‘n quáº£ng cÃ¡o' },
    { key: 'popup_aff_link', label: 'Link affiliate',        type: 'text',     placeholder: 'https://shope.ee/...', hint: 'Báº¥m vÃ o popup sáº½ nháº£y sang link nÃ y' },
    { key: 'popup_title',    label: 'TiÃªu Ä‘á» popup',         type: 'text',     placeholder: 'ðŸ”¥ Deal HÃ´m Nay â€“ Giáº£m 50%!' },
    { key: 'popup_subtitle', label: 'MÃ´ táº£ ngáº¯n',            type: 'text',     placeholder: 'Æ¯u Ä‘Ã£i cÃ³ háº¡n â€“ mua ngay káº»o háº¿t!' },
    { key: 'popup_btn_text', label: 'Text nÃºt báº¥m',          type: 'text',     placeholder: 'Mua Ngay â€“ GiÃ¡ Tá»‘t Nháº¥t!' },
    { key: 'popup_delay',    label: 'Delay xuáº¥t hiá»‡n (giÃ¢y)', type: 'text',    placeholder: '2', hint: 'Máº·c Ä‘á»‹nh 2 giÃ¢y sau khi vÃ o trang' },
  ],
  seo: [
    { key: 'seo_title',       label: 'TiÃªu Ä‘á» trang (SEO)',       type: 'text',     placeholder: 'Shopee Deals â€“ SÄƒn Deal Má»—i NgÃ y', hint: 'NÃªn dÆ°á»›i 60 kÃ½ tá»±' },
    { key: 'seo_description', label: 'MÃ´ táº£ (meta description)',  type: 'textarea', placeholder: 'Tá»•ng há»£p sáº£n pháº©m giáº£m giÃ¡ tá»‘t nháº¥t tá»« Shopee...', hint: 'NÃªn tá»« 120â€“160 kÃ½ tá»±' },
    { key: 'seo_keywords',    label: 'Keywords',                   type: 'text',     placeholder: 'shopee, deal, giáº£m giÃ¡, affiliate', hint: 'NgÄƒn cÃ¡ch báº±ng dáº¥u pháº©y' },
    { key: 'og_title',        label: 'TiÃªu Ä‘á» khi chia sáº» link (OG Title)',  type: 'text', placeholder: 'Shopee Deals â€“ Deal Ngon Má»—i NgÃ y', hint: 'Hiá»‡n khi chia sáº» lÃªn Zalo, Facebook, Messenger...' },
    { key: 'og_description',  label: 'MÃ´ táº£ khi chia sáº» link (OG Description)', type: 'textarea', placeholder: 'Sáº£n pháº©m giáº£m giÃ¡ tá»‘t nháº¥t tá»« Shopee, giao hÃ ng toÃ n quá»‘c.', hint: 'NÃªn tá»« 60â€“120 kÃ½ tá»±' },
    { key: 'og_image',        label: 'áº¢nh khi chia sáº» link (OG Image URL)', type: 'text', placeholder: 'https://...jpg', hint: 'áº¢nh hiá»‡n ra khi share link lÃªn máº¡ng XH (1200x630px)' },
    { key: 'ga_id',           label: 'Google Analytics ID',        type: 'text',     placeholder: 'G-XXXXXXXXXX' },
    { key: 'fb_pixel',        label: 'Facebook Pixel ID',          type: 'text',     placeholder: '123456789' },
  ],
}

// Cáº¥u hÃ¬nh tá»«ng máº¡ng XH â€” thá»© tá»± hiá»ƒn thá»‹
const SOCIAL_CHANNELS = [
  { key: 'social_shopee',    label: 'Shopee',    icon: 'ðŸ›’', color: '#ee4d2d', placeholder: 'https://shopee.vn/shop/...',       hint: 'Link shop Shopee cá»§a báº¡n' },
  { key: 'social_facebook',  label: 'Facebook',  icon: 'ðŸ“˜', color: '#1877f2', placeholder: 'https://facebook.com/...',          hint: 'Link Facebook Page' },
  { key: 'social_zalo',      label: 'Zalo',      icon: 'ðŸ’¬', color: '#0068ff', placeholder: '0912345678 hoáº·c https://zalo.me/...', hint: 'Nháº­p SÄT hoáº·c link Zalo OA' },
  { key: 'social_tiktok',    label: 'TikTok',    icon: 'ðŸŽµ', color: '#010101', placeholder: 'https://tiktok.com/@...',           hint: 'Link TikTok cá»§a báº¡n' },
  { key: 'social_youtube',   label: 'YouTube',   icon: 'â–¶ï¸', color: '#ff0000', placeholder: 'https://youtube.com/@...',          hint: 'Link YouTube channel' },
  { key: 'social_instagram', label: 'Instagram', icon: 'ðŸ“·', color: '#e1306c', placeholder: 'https://instagram.com/...',         hint: 'Link Instagram' },
  { key: 'contact_email',    label: 'Email liÃªn há»‡', icon: 'âœ‰ï¸', color: '#6b7280', placeholder: 'contact@example.com',          hint: 'Hiá»ƒn thá»‹ á»Ÿ footer' },
]

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function hexToRgb(hex: string) {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return isNaN(r) ? '238,77,45' : `${r},${g},${b}`
}
function darken(hex: string, pct = 0.15) {
  const c = hex.replace('#', '')
  const r = Math.max(0, Math.round(parseInt(c.slice(0,2),16) * (1-pct)))
  const g = Math.max(0, Math.round(parseInt(c.slice(2,4),16) * (1-pct)))
  const b = Math.max(0, Math.round(parseInt(c.slice(4,6),16) * (1-pct)))
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [activeTab, setActiveTab] = useState('giaodien')
  const [previewOpen, setPreviewOpen] = useState(false)
  const previewRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      // Gom táº¥t cáº£ fields tá»« táº¥t cáº£ tabs
      const allFields = Object.values(TAB_FIELDS).flat()
      const socialFields = SOCIAL_CHANNELS.flatMap(ch => [
        { key: ch.key, placeholder: '' },
        { key: `${ch.key}_show`, placeholder: 'true' },
      ])
      const merged = { ...data }
      // Náº¿u key chÆ°a cÃ³ giÃ¡ trá»‹ thÃ¬ Ä‘iá»n placeholder máº·c Ä‘á»‹nh
      for (const f of [...allFields, ...socialFields]) {
        if (f.placeholder && (merged[f.key] === undefined || merged[f.key] === '')) {
          merged[f.key] = f.placeholder
        }
      }
      setSettings(merged)
      setLoading(false)
    })
  }, [])

  const set = (key: string, value: string) => {
    setSettings(s => ({ ...s, [key]: value }))
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const primary = settings.primary_color || '#ee4d2d'
  const rgb     = hexToRgb(primary)
  const dark    = darken(primary)

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:80, color:'#9ca3af' }}>
      <div style={{ fontSize:32, marginRight:12 }}>âš™ï¸</div>
      <div>Äang táº£i cÃ i Ä‘áº·t...</div>
    </div>
  )

  const fields = TAB_FIELDS[activeTab] || []

  return (
    <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* â”€â”€ Topbar â”€â”€ */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:'#111' }}>âš™ï¸ CÃ i Ä‘áº·t website</h2>
          <p style={{ margin:'4px 0 0', color:'#6b7280', fontSize:13 }}>TÃ¹y chá»‰nh giao diá»‡n vÃ  ná»™i dung â€” khÃ´ng cáº§n chá»‰nh code</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => setPreviewOpen(v => !v)}
            style={{ background:'white', color:'#374151', border:'1.5px solid #e5e7eb', padding:'9px 18px', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            ðŸ‘ï¸ {previewOpen ? 'áº¨n preview' : 'Live Preview'}
          </button>
          <button onClick={save} disabled={saving} style={{
            background: saving ? '#9ca3af' : saved ? '#059669' : primary,
            color:'white', border:'none', padding:'9px 24px', borderRadius:8,
            fontWeight:700, fontSize:13, cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow:`0 2px 10px rgba(${rgb},0.35)`, transition:'background 0.2s',
          }}>
            {saving ? 'â³ Äang lÆ°u...' : saved ? 'âœ… ÄÃ£ lÆ°u!' : 'ðŸ’¾ LÆ°u'}
          </button>
        </div>
      </div>

      <div style={{ display:'flex', gap:20, alignItems:'flex-start', flexWrap:'wrap' }}>

        {/* â”€â”€ Left: Tabs + Fields â”€â”€ */}
        <div style={{ flex:1, minWidth:320 }}>
          {/* Tab bar */}
          <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding:'8px 14px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
                background: activeTab === t.id ? primary : 'white',
                color: activeTab === t.id ? 'white' : '#374151',
                boxShadow: activeTab === t.id ? `0 2px 8px rgba(${rgb},0.35)` : '0 1px 3px rgba(0,0,0,0.08)',
                transition:'all 0.15s',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ background:'white', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', display:'flex', flexDirection:'column', gap:20 }}>

            {/* â”€â”€ Tab Máº¡ng XH: render riÃªng â”€â”€ */}
            {activeTab === 'mang_xa_hoi' ? (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ fontSize:13, color:'#6b7280', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 14px' }}>
                  ðŸ’¡ Nháº­p link hoáº·c thÃ´ng tin tá»«ng kÃªnh. Báº­t/táº¯t toggle Ä‘á»ƒ hiá»‡n hoáº·c áº©n khá»i footer website.
                </div>
                {SOCIAL_CHANNELS.map(ch => {
                  const urlVal  = settings[ch.key] || ''
                  const showKey = `${ch.key}_show`
                  const isShown = settings[showKey] !== 'false'
                  const hasUrl  = !!urlVal.trim()

                  return (
                    <div key={ch.key} style={{ border:'1.5px solid #e5e7eb', borderRadius:10, overflow:'hidden', opacity: hasUrl ? 1 : 0.7 }}>
                      {/* Header row */}
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                        <span style={{ fontSize:20 }}>{ch.icon}</span>
                        <span style={{ fontWeight:700, fontSize:14, color:'#111', flex:1 }}>{ch.label}</span>
                        {/* Toggle show/hide */}
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:12, color: isShown && hasUrl ? primary : '#9ca3af', fontWeight:600 }}>
                            {isShown && hasUrl ? 'ðŸ‘ï¸ Hiá»ƒn thá»‹' : 'ðŸ™ˆ áº¨n'}
                          </span>
                          <div onClick={() => set(showKey, isShown ? 'false' : 'true')}
                            style={{
                              width:42, height:24, borderRadius:12, cursor:'pointer',
                              background: isShown && hasUrl ? primary : '#d1d5db',
                              position:'relative', transition:'background 0.2s', flexShrink:0,
                            }}>
                            <div style={{
                              width:18, height:18, borderRadius:'50%', background:'white',
                              position:'absolute', top:3,
                              left: isShown ? 21 : 3,
                              transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
                            }} />
                          </div>
                        </div>
                      </div>
                      {/* URL input */}
                      <div style={{ padding:'10px 14px' }}>
                        {ch.hint && <div style={{ fontSize:11, color:'#9ca3af', marginBottom:6 }}>ðŸ’¡ {ch.hint}</div>}
                        <input
                          type="text"
                          value={urlVal}
                          onChange={e => set(ch.key, e.target.value)}
                          placeholder={ch.placeholder}
                          style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color 0.15s' }}
                          onFocus={e => (e.target as HTMLInputElement).style.borderColor = ch.color}
                          onBlur={e  => (e.target as HTMLInputElement).style.borderColor = '#e5e7eb'}
                        />
                        {urlVal.trim() && (
                          <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ width:8, height:8, borderRadius:'50%', background: isShown ? '#22c55e' : '#d1d5db' }} />
                            <span style={{ fontSize:11, color: isShown ? '#22c55e' : '#9ca3af' }}>
                              {isShown ? 'Sáº½ hiá»ƒn thá»‹ á»Ÿ footer' : 'Äang áº©n khá»i footer'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* â”€â”€ CÃ¡c tab khÃ¡c: render fields bÃ¬nh thÆ°á»ng â”€â”€ */
              fields.map(field => (
                <FieldRow
                  key={field.key}
                  field={field}
                  value={settings[field.key] ?? ''}
                  primary={primary}
                  rgb={rgb}
                  onChange={v => set(field.key, v)}
                />
              ))
            )}

            {/* Palette nhanh á»Ÿ tab giao diá»‡n */}
            {activeTab === 'giaodien' && (
              <div>
                <label style={{ fontSize:13, fontWeight:700, color:'#374151', display:'block', marginBottom:8 }}>
                  ðŸŽ¨ Báº£ng mÃ u gá»£i Ã½
                </label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {PALETTES.map(p => (
                    <button key={p.color} onClick={() => set('primary_color', p.color)}
                      title={p.name}
                      style={{
                        width:36, height:36, borderRadius:8, border: settings.primary_color === p.color ? `3px solid ${p.color}` : '3px solid transparent',
                        background:p.color, cursor:'pointer', outline: settings.primary_color === p.color ? `2px solid white` : 'none',
                        outlineOffset:1, boxShadow:'0 2px 6px rgba(0,0,0,0.15)', transition:'transform 0.1s',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* â”€â”€ Right: Live Preview (chá»‰ tab giao diá»‡n) â”€â”€ */}
        {previewOpen && (
          <div style={{ width:260, flexShrink:0 }}>
            <div style={{ background:'white', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', border:'1px solid #e5e7eb' }}>
              {/* Preview header */}
              <div style={{ background:primary, padding:'8px 14px', display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:14 }}>{settings.site_logo_emoji || 'ðŸ›ï¸'}</span>
                <span style={{ color:'white', fontWeight:700, fontSize:12 }}>{settings.site_name || 'Shopee Deals'}</span>
              </div>
              {/* Preview banner */}
              <div style={{ background:`${primary}22`, padding:'10px 14px', textAlign:'center' }}>
                <div style={{ fontSize:11, fontWeight:700, color:primary }}>{settings.banner_title || 'ðŸ”¥ Deal Hot Má»—i NgÃ y'}</div>
              </div>
              {/* Preview products */}
              <div style={{ padding:10 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} style={{ background:'white', borderRadius:6, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
                      <div style={{ height:52, background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>ðŸ“¦</div>
                      <div style={{ padding:'4px 6px' }}>
                        <div style={{ fontSize:9, fontWeight:600, color:'#333', marginBottom:2 }}>Sáº£n pháº©m {i}</div>
                        <div style={{ fontSize:10, fontWeight:800, color:primary }}>120.000Ä‘</div>
                        <div style={{ marginTop:4, background:primary, color:'white', textAlign:'center', borderRadius:4, padding:'2px 0', fontSize:9, fontWeight:700 }}>
                          {settings.buy_button_text || 'Mua Ngay'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Preview social in footer */}
              <div style={{ background:'#222', padding:'8px 14px', textAlign:'center' }}>
                <div style={{ color:'white', fontWeight:700, fontSize:11 }}>{settings.site_logo_emoji || 'ðŸ›ï¸'} {settings.site_name || 'Shopee Deals'}</div>
                {/* Hiá»‡n social badges preview */}
                <div style={{ display:'flex', justifyContent:'center', gap:4, flexWrap:'wrap', marginTop:6 }}>
                  {SOCIAL_CHANNELS.filter(ch => settings[ch.key]?.trim() && settings[`${ch.key}_show`] !== 'false').map(ch => (
                    <span key={ch.key} style={{ fontSize:11, background:ch.color, color:'white', padding:'2px 7px', borderRadius:10, fontWeight:600 }}>
                      {ch.icon}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize:9, marginTop:4, color:'#666' }}>{settings.footer_copyright || 'Â© 2025 Â· Affiliate Website'}</div>
              </div>
            </div>

            {/* Báº£ng mÃ u hiá»‡n táº¡i */}
            <div style={{ marginTop:12, background:'white', borderRadius:12, padding:'12px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:8 }}>Báº£ng mÃ u hiá»‡n táº¡i</div>
              <div style={{ display:'flex', gap:8 }}>
                {[primary, darken(primary,0.1), darken(primary,0.25), `rgba(${rgb},0.15)`, `rgba(${rgb},0.08)`].map((c,i) => (
                  <div key={i} style={{ flex:1, textAlign:'center' }}>
                    <div style={{ height:28, background:c, borderRadius:6, border:'1px solid #f0f0f0' }} />
                    <div style={{ fontSize:9, color:'#9ca3af', marginTop:3 }}>
                      {['ChÃ­nh','Tá»‘i','Äáº­m','Nháº¡t','Ráº¥t nháº¡t'][i]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky save bottom */}
      <div style={{ position:'sticky', bottom:20, marginTop:24, display:'flex', justifyContent:'flex-end' }}>
        <button onClick={save} disabled={saving} style={{
          background: saving ? '#9ca3af' : saved ? '#059669' : primary,
          color:'white', border:'none', padding:'12px 36px',
          borderRadius:10, fontWeight:700, fontSize:15,
          cursor: saving ? 'not-allowed' : 'pointer',
          boxShadow:`0 4px 16px rgba(${rgb},0.4)`, transition:'background 0.2s',
        }}>
          {saving ? 'â³ Äang lÆ°u...' : saved ? 'âœ… ÄÃ£ lÆ°u thÃ nh cÃ´ng!' : 'ðŸ’¾ LÆ°u thay Ä‘á»•i'}
        </button>
      </div>
    </div>
  )
}

// â”€â”€â”€ Field Row component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FieldRow({ field, value, primary, rgb, onChange }: {
  field: { key: string; label: string; type: string; placeholder: string; hint?: string }
  value: string
  primary: string
  rgb: string
  onChange: (v: string) => void
}) {
  const base: React.CSSProperties = {
    width:'100%', padding:'10px 14px',
    border:'1.5px solid #e5e7eb', borderRadius:8,
    fontSize:14, outline:'none', background:'white',
    boxSizing:'border-box', fontFamily:'inherit',
    transition:'border-color 0.15s',
  }

  return (
    <div>
      <label style={{ fontSize:13, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>
        {field.label}
        <span style={{ fontSize:11, color:'#9ca3af', fontWeight:400, marginLeft:8 }}>({field.key})</span>
      </label>
      {field.hint && (
        <div style={{ fontSize:11, color:'#9ca3af', marginBottom:6 }}>ðŸ’¡ {field.hint}</div>
      )}

      {field.type === 'toggle' ? (
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div onClick={() => onChange(value === 'true' ? 'false' : 'true')}
            style={{
              width:48, height:26, borderRadius:13, cursor:'pointer',
              background: value === 'true' ? primary : '#d1d5db',
              position:'relative', transition:'background 0.2s', flexShrink:0,
              boxShadow: value === 'true' ? `0 0 0 3px rgba(${rgb},0.2)` : 'none',
            }}>
            <div style={{
              width:20, height:20, borderRadius:'50%', background:'white',
              position:'absolute', top:3,
              left: value === 'true' ? 25 : 3,
              transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
          <span style={{ fontSize:13, color: value === 'true' ? primary : '#6b7280', fontWeight:600 }}>
            {value === 'true' ? 'âœ… Äang hiá»ƒn thá»‹' : 'â­• Äang áº©n'}
          </span>
        </div>

      ) : field.type === 'color' ? (
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <input type="color" value={value || field.placeholder} onChange={e => onChange(e.target.value)}
            style={{ width:48, height:40, borderRadius:8, border:'1.5px solid #e5e7eb', cursor:'pointer', padding:2 }} />
          <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder}
            style={{ ...base, width:130 }} />
          <div style={{ width:40, height:40, borderRadius:8, background: value || field.placeholder, border:'1px solid #e5e7eb', boxShadow:`0 2px 8px rgba(${rgb},0.3)` }} />
          <span style={{ fontSize:12, color:'#9ca3af' }}>Preview</span>
        </div>

      ) : field.type === 'textarea' ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} rows={3}
          style={{ ...base, resize:'vertical', lineHeight:1.6 }} />

      ) : field.type === 'select_grid' ? (
        <select value={value || '180'} onChange={e => onChange(e.target.value)} style={base}>
          <option value="140">Nhá» â€” nhiá»u sáº£n pháº©m má»—i hÃ ng</option>
          <option value="180">Vá»«a (máº·c Ä‘á»‹nh)</option>
          <option value="220">Lá»›n â€” áº£nh to hÆ¡n</option>
          <option value="280">Ráº¥t lá»›n â€” 3-4 sáº£n pháº©m/hÃ ng</option>
        </select>
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} style={base} />
      )}
    </div>
  )
}
