'use client'

import { useEffect, useState, useRef } from 'react'

type Settings = Record<string, string>

// ─── Color Palettes gợi ý ──────────────────────────────────────────────────
const PALETTES = [
  { name: 'Shopee Cam',   color: '#ee4d2d' },
  { name: 'Tím Hoàng gia', color: '#7c3aed' },
  { name: 'Xanh Navy',    color: '#1d4ed8' },
  { name: 'Xanh Lá',      color: '#059669' },
  { name: 'Hồng Hot',     color: '#db2777' },
  { name: 'Cam Vàng',     color: '#d97706' },
  { name: 'Đỏ Ruby',      color: '#dc2626' },
  { name: 'Xanh Cyan',    color: '#0891b2' },
  { name: 'Đen Thanh lịch', color: '#1f2937' },
]

// ─── Tabs config ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'giaodien',    label: '🎨 Giao diện' },
  { id: 'banner',      label: '📢 Banner' },
  { id: 'noidung',     label: '📝 Nội dung' },
  { id: 'chinh_sach',  label: '📋 Chính sách' },
  { id: 'mang_xa_hoi', label: '📱 Mạng XH' },
  { id: 'float_contact', label: '📞 Nút liên hệ' },
  { id: 'danh_gia',    label: '💬 Đánh giá' },
  { id: 'seo',         label: '🔍 SEO' },
  { id: 'popup',       label: '🎯 Popup QC' },
]

// ─── Fields theo tab ──────────────────────────────────────────────────────
const TAB_FIELDS: Record<string, { key: string; label: string; type: string; placeholder: string; hint?: string }[]> = {
  giaodien: [
    { key: 'primary_color',   label: 'Màu chủ đạo',      type: 'color',  placeholder: '#ee4d2d', hint: 'Áp dụng cho header, nút, giá sản phẩm...' },
    { key: 'footer_color',    label: 'Màu nền footer',    type: 'color',  placeholder: '#1a1a1a', hint: 'Nên dùng màu tối' },
    { key: 'bg_color',        label: 'Màu nền trang',     type: 'color',  placeholder: '#f5f5f5', hint: 'Màu background chính' },
    { key: 'site_logo_emoji', label: 'Logo (emoji)',       type: 'text',   placeholder: '🛍️',   hint: 'Hiển thị ở header và footer' },
    { key: 'grid_size',       label: 'Kích thước card sản phẩm', type: 'select_grid', placeholder: '180' },
  ],
  banner: [
    { key: 'banner_show',       label: 'Hiện banner trang chủ',  type: 'toggle',   placeholder: 'true' },
    { key: 'banner_image',      label: 'Ảnh banner (để trống = dùng màu gradient)', type: 'image_upload', placeholder: 'https://i.ibb.co/...jpg', hint: '📐 Kích thước chuẩn: 1200×280px (ngang rộng, lưu JPG/PNG <500KB). GIF động cũng được!' },
    { key: 'banner_link',       label: 'Link khi bấm vào ảnh banner', type: 'text', placeholder: '/?sort=popular', hint: 'Để trống nếu không muốn click được' },
    { key: 'banner_title',      label: 'Tiêu đề banner (khi không có ảnh)', type: 'text', placeholder: '🔥 Deal Hot Mỗi Ngày' },
    { key: 'banner_subtitle',   label: 'Mô tả banner',           type: 'textarea', placeholder: 'Hàng ngàn sản phẩm giảm giá sâu...' },
    { key: 'banner_cta_text',   label: 'Text nút CTA (tùy chọn)', type: 'text',    placeholder: 'Xem ngay' },
    { key: 'banner_cta_link',   label: 'Link nút CTA',           type: 'text',     placeholder: '/?cat=dien-tu' },
    { key: 'announcement_show', label: 'Hiện thông báo nổi',     type: 'toggle',   placeholder: 'false' },
    { key: 'announcement_text', label: 'Nội dung thông báo',     type: 'text',     placeholder: '🎉 Miễn phí vận chuyển cho đơn từ 200k!' },
    { key: 'announcement_color',label: 'Màu thông báo',          type: 'color',    placeholder: '#059669' },
  ],
  noidung: [
    { key: 'site_name',        label: 'Tên website',        type: 'text',     placeholder: 'Shopee Deals' },
    { key: 'site_tagline',     label: 'Slogan',             type: 'text',     placeholder: 'Deal hot mỗi ngày' },
    { key: 'buy_button_text',  label: 'Text nút Mua Ngay',  type: 'text',     placeholder: 'Mua Ngay' },
    { key: 'shopee_badge',     label: 'Badge Shopee',        type: 'text',     placeholder: 'Đảm bảo chính hãng · Giao nhanh' },
    { key: 'footer_text',      label: 'Mô tả footer',       type: 'textarea', placeholder: 'Tổng hợp sản phẩm giảm giá...' },
    { key: 'footer_copyright', label: 'Copyright',          type: 'text',     placeholder: '© 2025 · Affiliate Website' },
  ],
  chinh_sach: [
    { key: 'shipping_text',    label: 'Vận chuyển',   type: 'text',   placeholder: '🚚 Miễn phí vận chuyển · Giao trong 2-5 ngày' },
    { key: 'guarantee_text',   label: 'Đảm bảo',     type: 'text',   placeholder: '✅ Hoàn tiền nếu hàng không đúng mô tả' },
    { key: 'return_text',      label: 'Đổi trả',      type: 'text',   placeholder: '↩️ Đổi trả miễn phí trong 15 ngày' },
    { key: 'voucher_text',     label: 'Text Voucher (VD: 15.5 VOUCHER Giảm thêm 30%)', type: 'text', placeholder: '15.5 VOUCHER Giảm thêm 30%', hint: 'Hiển thị thanh đỏ trên tất cả ảnh sản phẩm. Giữ ngắn gọn, tối đa ~30 ký tự để không bị cắt' },
    { key: 'show_fake_stats',  label: 'Hiện lượt xem & đã bán giả', type: 'toggle', placeholder: 'true', hint: 'Tạo độ tin tưởng cho khách hàng' },
    { key: 'show_related',     label: 'Hiện sản phẩm liên quan', type: 'toggle', placeholder: 'true' },
  ],
  mang_xa_hoi: [], // Render riêng bên dưới
  float_contact: [], // Render riêng bên dưới
  danh_gia: [
    { key: 'show_reviews', label: 'Hiện section đánh giá sản phẩm', type: 'toggle', placeholder: 'true', hint: 'Cho phép người dùng xem và gửi đánh giá trên trang sản phẩm' },
  ],
  popup: [
    { key: 'popup_show',     label: 'Bật popup quảng cáo', type: 'toggle',   placeholder: 'false', hint: 'Popup xuất hiện sau vài giây khi khách vào trang' },
    { key: 'popup_image',    label: 'Link ảnh popup',       type: 'image_upload', placeholder: 'https://...jpg', hint: '📐 Kích thước chuẩn: 600×800px (dọc, tỉ lệ 3:4). Lưu JPG/PNG <300KB để load nhanh' },
    { key: 'popup_aff_link', label: 'Link affiliate',        type: 'text',     placeholder: 'https://shope.ee/...', hint: 'Bấm vào popup sẽ nhảy sang link này' },
    { key: 'popup_title',    label: 'Tiêu đề popup',         type: 'text',     placeholder: '🔥 Deal Hôm Nay – Giảm 50%!' },
    { key: 'popup_subtitle', label: 'Mô tả ngắn',            type: 'text',     placeholder: 'Ưu đãi có hạn – mua ngay kẻo hết!' },
    { key: 'popup_btn_text', label: 'Text nút bấm',          type: 'text',     placeholder: 'Mua Ngay – Giá Tốt Nhất!' },
    { key: 'popup_delay',    label: 'Delay xuất hiện (giây)', type: 'text',    placeholder: '2', hint: 'Mặc định 2 giây sau khi vào trang' },
  ],
  seo: [
    { key: 'seo_title',       label: 'Tiêu đề trang (SEO)',       type: 'text',     placeholder: 'Shopee Deals – Săn Deal Mỗi Ngày', hint: 'Nên dưới 60 ký tự' },
    { key: 'seo_description', label: 'Mô tả (meta description)',  type: 'textarea', placeholder: 'Tổng hợp sản phẩm giảm giá tốt nhất từ Shopee...', hint: 'Nên từ 120–160 ký tự' },
    { key: 'seo_keywords',    label: 'Keywords',                   type: 'text',     placeholder: 'shopee, deal, giảm giá, affiliate', hint: 'Ngăn cách bằng dấu phẩy' },
    { key: 'og_title',        label: 'Tiêu đề khi chia sẻ link (OG Title)',  type: 'text', placeholder: 'Shopee Deals – Deal Ngon Mỗi Ngày', hint: 'Hiện khi chia sẻ lên Zalo, Facebook, Messenger...' },
    { key: 'og_description',  label: 'Mô tả khi chia sẻ link (OG Description)', type: 'textarea', placeholder: 'Sản phẩm giảm giá tốt nhất từ Shopee, giao hàng toàn quốc.', hint: 'Nên từ 60–120 ký tự' },
    { key: 'og_image',        label: 'Ảnh khi chia sẻ link (OG Image URL)', type: 'image_upload', placeholder: 'https://...jpg', hint: '📐 Kích thước chuẩn: 1200×630px (bắt buộc đúng tỉ lệ để hiện đẹp trên Facebook/Zalo). Lưu JPG <500KB' },
    { key: 'ga_id',           label: 'Google Analytics ID',        type: 'text',     placeholder: 'G-XXXXXXXXXX' },
    { key: 'fb_pixel',        label: 'Facebook Pixel ID',          type: 'text',     placeholder: '123456789' },
  ],
}

// Cấu hình từng mạng XH — thứ tự hiển thị
const SOCIAL_CHANNELS = [
  { key: 'social_shopee',    label: 'Shopee',    icon: '🛒', color: '#ee4d2d', placeholder: 'https://shopee.vn/shop/...',       hint: 'Link shop Shopee của bạn' },
  { key: 'social_facebook',  label: 'Facebook',  icon: '📘', color: '#1877f2', placeholder: 'https://facebook.com/...',          hint: 'Link Facebook Page' },
  { key: 'social_zalo',      label: 'Zalo',      icon: '💬', color: '#0068ff', placeholder: '0912345678 hoặc https://zalo.me/...', hint: 'Nhập SĐT hoặc link Zalo OA' },
  { key: 'social_tiktok',    label: 'TikTok',    icon: '🎵', color: '#010101', placeholder: 'https://tiktok.com/@...',           hint: 'Link TikTok của bạn' },
  { key: 'social_youtube',   label: 'YouTube',   icon: '▶️', color: '#ff0000', placeholder: 'https://youtube.com/@...',          hint: 'Link YouTube channel' },
  { key: 'social_instagram', label: 'Instagram', icon: '📷', color: '#e1306c', placeholder: 'https://instagram.com/...',         hint: 'Link Instagram' },
  { key: 'contact_email',    label: 'Email liên hệ', icon: '✉️', color: '#6b7280', placeholder: 'contact@example.com',          hint: 'Hiển thị ở footer' },
]

// Cấu hình nút nổi liên hệ
const FLOAT_BUTTONS = [
  {
    key: 'float_phone',
    label: 'Số điện thoại',
    icon: '📞',
    color: '#22c55e',
    placeholder: '0912345678',
    hint: 'Nhấn vào sẽ gọi điện trực tiếp',
    showKey: 'float_phone_show',
    showLabel: 'Hiện nút Gọi điện',
  },
  {
    key: 'float_zalo',
    label: 'Zalo',
    icon: '💬',
    color: '#0068ff',
    placeholder: '0912345678 hoặc https://zalo.me/...',
    hint: 'Nhập SĐT hoặc link Zalo OA. Nhấn vào mở chat Zalo',
    showKey: 'float_zalo_show',
    showLabel: 'Hiện nút Zalo',
  },
  {
    key: 'float_facebook',
    label: 'Facebook',
    icon: '📘',
    color: '#1877f2',
    placeholder: 'https://facebook.com/your-page',
    hint: 'Link Facebook Page. Nhấn vào mở trang Facebook',
    showKey: 'float_facebook_show',
    showLabel: 'Hiện nút Facebook',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────
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

// ─── Main Component ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [activeTab, setActiveTab] = useState('giaodien')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      const allFields = Object.values(TAB_FIELDS).flat()
      const socialFields = SOCIAL_CHANNELS.flatMap(ch => [
        { key: ch.key, placeholder: '' },
        { key: `${ch.key}_show`, placeholder: 'true' },
      ])
      const floatFields = FLOAT_BUTTONS.flatMap(btn => [
        { key: btn.key, placeholder: '' },
        { key: btn.showKey, placeholder: 'true' },
      ])
      const merged = { ...data }
      for (const f of [...allFields, ...socialFields, ...floatFields]) {
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

  const uploadImage = async (key: string, file: File) => {
    setUploadingKey(key)
    try {
      const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', uploadPreset)
      fd.append('folder', 'shopee-aff/settings')
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      if (data.secure_url) set(key, data.secure_url)
      else alert('Upload thất bại: ' + (data.error?.message || 'Lỗi không xác định'))
    } catch (e) {
      alert('Lỗi upload: ' + e)
    } finally {
      setUploadingKey(null)
    }
  }

  const primary = settings.primary_color || '#ee4d2d'
  const rgb     = hexToRgb(primary)
  const dark    = darken(primary)

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:80, color:'#9ca3af' }}>
      <div style={{ fontSize:32, marginRight:12 }}>⚙️</div>
      <div>Đang tải cài đặt...</div>
    </div>
  )

  const fields = TAB_FIELDS[activeTab] || []

  return (
    <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* ── Topbar ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:'#111' }}>⚙️ Cài đặt website</h2>
          <p style={{ margin:'4px 0 0', color:'#6b7280', fontSize:13 }}>Tùy chỉnh giao diện và nội dung — không cần chỉnh code</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => setPreviewOpen(v => !v)}
            style={{ background:'white', color:'#374151', border:'1.5px solid #e5e7eb', padding:'9px 18px', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            👁️ {previewOpen ? 'Ẩn preview' : 'Live Preview'}
          </button>
          <button onClick={save} disabled={saving} style={{
            background: saving ? '#9ca3af' : saved ? '#059669' : primary,
            color:'white', border:'none', padding:'9px 24px', borderRadius:8,
            fontWeight:700, fontSize:13, cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow:`0 2px 10px rgba(${rgb},0.35)`, transition:'background 0.2s',
          }}>
            {saving ? '⏳ Đang lưu...' : saved ? '✅ Đã lưu!' : '💾 Lưu'}
          </button>
        </div>
      </div>

      <div style={{ display:'flex', gap:20, alignItems:'flex-start', flexWrap:'wrap' }}>

        {/* ── Left: Tabs + Fields ── */}
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

            {/* ── Tab Mạng XH: render riêng ── */}
            {activeTab === 'mang_xa_hoi' ? (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ fontSize:13, color:'#6b7280', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 14px' }}>
                  💡 Nhập link hoặc thông tin từng kênh. Bật/tắt toggle để hiện hoặc ẩn khỏi footer website.
                </div>
                {SOCIAL_CHANNELS.map(ch => {
                  const urlVal  = settings[ch.key] || ''
                  const showKey = `${ch.key}_show`
                  const isShown = settings[showKey] !== 'false'
                  const hasUrl  = !!urlVal.trim()

                  return (
                    <div key={ch.key} style={{ border:'1.5px solid #e5e7eb', borderRadius:10, overflow:'hidden', opacity: hasUrl ? 1 : 0.7 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                        <span style={{ fontSize:20 }}>{ch.icon}</span>
                        <span style={{ fontWeight:700, fontSize:14, color:'#111', flex:1 }}>{ch.label}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:12, color: isShown && hasUrl ? primary : '#9ca3af', fontWeight:600 }}>
                            {isShown && hasUrl ? '👁️ Hiển thị' : '🙈 Ẩn'}
                          </span>
                          <div onClick={() => set(showKey, isShown ? 'false' : 'true')}
                            style={{ width:42, height:24, borderRadius:12, cursor:'pointer', background: isShown && hasUrl ? primary : '#d1d5db', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                            <div style={{ width:18, height:18, borderRadius:'50%', background:'white', position:'absolute', top:3, left: isShown ? 21 : 3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ padding:'10px 14px' }}>
                        {ch.hint && <div style={{ fontSize:11, color:'#9ca3af', marginBottom:6 }}>💡 {ch.hint}</div>}
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
                              {isShown ? 'Sẽ hiển thị ở footer' : 'Đang ẩn khỏi footer'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

            ) : activeTab === 'float_contact' ? (
              /* ── Tab Nút liên hệ nổi ── */
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {/* Intro card */}
                <div style={{ background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', border:'1px solid #bae6fd', borderRadius:10, padding:'14px 16px' }}>
                  <div style={{ fontWeight:700, color:'#0369a1', fontSize:14, marginBottom:6 }}>📞 Nút liên hệ nổi góc phải màn hình</div>
                  <div style={{ fontSize:12, color:'#0369a1', lineHeight:1.6 }}>
                    Các nút này hiển thị cố định ở góc phải màn hình, giúp khách hàng liên hệ nhanh chóng.
                    Nhập thông tin và bật toggle để hiện nút tương ứng.
                  </div>
                </div>

                {/* Preview nút nổi */}
                <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:'14px 16px' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:10 }}>👁️ Preview các nút sẽ hiển thị:</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-start' }}>
                    {FLOAT_BUTTONS.map(btn => {
                      const val     = settings[btn.key] || ''
                      const isShown = settings[btn.showKey] !== 'false'
                      const active  = isShown && !!val.trim()
                      return (
                        <div key={btn.key} style={{ display:'flex', alignItems:'center', gap:10, opacity: active ? 1 : 0.35 }}>
                          <div style={{ width:44, height:44, borderRadius:'50%', background: active ? btn.color : '#d1d5db', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow: active ? `0 4px 12px ${btn.color}55` : 'none', transition:'all 0.2s' }}>
                            {btn.icon}
                          </div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color: active ? '#111' : '#9ca3af' }}>{btn.label}</div>
                            <div style={{ fontSize:11, color: active ? '#6b7280' : '#d1d5db' }}>
                              {active ? val : 'Chưa cài đặt'}
                            </div>
                          </div>
                          {active && (
                            <div style={{ marginLeft:'auto', fontSize:11, background:'#dcfce7', color:'#16a34a', padding:'3px 8px', borderRadius:20, fontWeight:600 }}>
                              ✅ Đang hiện
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Từng nút config */}
                {FLOAT_BUTTONS.map(btn => {
                  const val     = settings[btn.key] || ''
                  const isShown = settings[btn.showKey] !== 'false'
                  const hasVal  = !!val.trim()

                  return (
                    <div key={btn.key} style={{ border:`1.5px solid ${hasVal && isShown ? btn.color + '55' : '#e5e7eb'}`, borderRadius:10, overflow:'hidden', transition:'border-color 0.2s' }}>
                      {/* Header */}
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background: hasVal && isShown ? `${btn.color}0d` : '#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                        <div style={{ width:36, height:36, borderRadius:'50%', background: hasVal && isShown ? btn.color : '#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, transition:'background 0.2s' }}>
                          {btn.icon}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:14, color:'#111' }}>{btn.label}</div>
                          <div style={{ fontSize:11, color:'#9ca3af' }}>{btn.showLabel}</div>
                        </div>
                        {/* Toggle */}
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:12, color: isShown && hasVal ? btn.color : '#9ca3af', fontWeight:600 }}>
                            {isShown && hasVal ? '👁️ Hiện' : '🙈 Ẩn'}
                          </span>
                          <div onClick={() => set(btn.showKey, isShown ? 'false' : 'true')}
                            style={{ width:42, height:24, borderRadius:12, cursor:'pointer', background: isShown && hasVal ? btn.color : '#d1d5db', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                            <div style={{ width:18, height:18, borderRadius:'50%', background:'white', position:'absolute', top:3, left: isShown ? 21 : 3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                          </div>
                        </div>
                      </div>

                      {/* Input */}
                      <div style={{ padding:'12px 16px' }}>
                        <div style={{ fontSize:11, color:'#9ca3af', marginBottom:6 }}>💡 {btn.hint}</div>
                        <input
                          type="text"
                          value={val}
                          onChange={e => set(btn.key, e.target.value)}
                          placeholder={btn.placeholder}
                          style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color 0.15s' }}
                          onFocus={e => (e.target as HTMLInputElement).style.borderColor = btn.color}
                          onBlur={e  => (e.target as HTMLInputElement).style.borderColor = '#e5e7eb'}
                        />
                        {val.trim() && (
                          <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                            <div style={{ width:8, height:8, borderRadius:'50%', background: isShown ? '#22c55e' : '#d1d5db', flexShrink:0 }} />
                            <span style={{ fontSize:11, color: isShown ? '#22c55e' : '#9ca3af' }}>
                              {isShown ? `✅ Nút ${btn.label} sẽ hiển thị ở góc phải màn hình` : `Đang ẩn nút ${btn.label}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Ghi chú vị trí */}
                <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#92400e' }}>
                  ⚠️ Các nút nổi hiển thị ở <strong>góc phải màn hình</strong>, chỉ hiện cho khách hàng (không hiện trong trang Admin).
                  Di chuột vào nút sẽ hiện label tên.
                </div>
              </div>

            ) : (
              /* ── Các tab khác: render fields bình thường ── */
              fields.map(field => (
                <FieldRow
                  key={field.key}
                  field={field}
                  value={settings[field.key] ?? ''}
                  primary={primary}
                  rgb={rgb}
                  onChange={v => set(field.key, v)}
                  uploading={uploadingKey === field.key}
                  onUpload={(file) => uploadImage(field.key, file)}
                />
              ))
            )}

            {/* Palette nhanh ở tab giao diện */}
            {activeTab === 'giaodien' && (
              <div>
                <label style={{ fontSize:13, fontWeight:700, color:'#374151', display:'block', marginBottom:8 }}>
                  🎨 Bảng màu gợi ý
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

        {/* ── Right: Live Preview (chỉ tab giao diện) ── */}
        {previewOpen && (
          <div style={{ width:260, flexShrink:0 }}>
            <div style={{ background:'white', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', border:'1px solid #e5e7eb' }}>
              {/* Preview header */}
              <div style={{ background:primary, padding:'8px 14px', display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:14 }}>{settings.site_logo_emoji || '🛍️'}</span>
                <span style={{ color:'white', fontWeight:700, fontSize:12 }}>{settings.site_name || 'Shopee Deals'}</span>
              </div>
              {/* Preview banner */}
              <div style={{ background:`${primary}22`, padding:'10px 14px', textAlign:'center' }}>
                <div style={{ fontSize:11, fontWeight:700, color:primary }}>{settings.banner_title || '🔥 Deal Hot Mỗi Ngày'}</div>
              </div>
              {/* Preview products */}
              <div style={{ padding:10 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} style={{ background:'white', borderRadius:6, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
                      <div style={{ height:52, background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📦</div>
                      <div style={{ padding:'4px 6px' }}>
                        <div style={{ fontSize:9, fontWeight:600, color:'#333', marginBottom:2 }}>Sản phẩm {i}</div>
                        <div style={{ fontSize:10, fontWeight:800, color:primary }}>120.000đ</div>
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
                <div style={{ color:'white', fontWeight:700, fontSize:11 }}>{settings.site_logo_emoji || '🛍️'} {settings.site_name || 'Shopee Deals'}</div>
                <div style={{ display:'flex', justifyContent:'center', gap:4, flexWrap:'wrap', marginTop:6 }}>
                  {SOCIAL_CHANNELS.filter(ch => settings[ch.key]?.trim() && settings[`${ch.key}_show`] !== 'false').map(ch => (
                    <span key={ch.key} style={{ fontSize:11, background:ch.color, color:'white', padding:'2px 7px', borderRadius:10, fontWeight:600 }}>
                      {ch.icon}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize:9, marginTop:4, color:'#666' }}>{settings.footer_copyright || '© 2025 · Affiliate Website'}</div>
              </div>
            </div>

            {/* Bảng màu hiện tại */}
            <div style={{ marginTop:12, background:'white', borderRadius:12, padding:'12px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:8 }}>Bảng màu hiện tại</div>
              <div style={{ display:'flex', gap:8 }}>
                {[primary, darken(primary,0.1), darken(primary,0.25), `rgba(${rgb},0.15)`, `rgba(${rgb},0.08)`].map((c,i) => (
                  <div key={i} style={{ flex:1, textAlign:'center' }}>
                    <div style={{ height:28, background:c, borderRadius:6, border:'1px solid #f0f0f0' }} />
                    <div style={{ fontSize:9, color:'#9ca3af', marginTop:3 }}>
                      {['Chính','Tối','Đậm','Nhạt','Rất nhạt'][i]}
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
          {saving ? '⏳ Đang lưu...' : saved ? '✅ Đã lưu thành công!' : '💾 Lưu thay đổi'}
        </button>
      </div>
    </div>
  )
}

// ─── Field Row component ──────────────────────────────────────────────────
function FieldRow({ field, value, primary, rgb, onChange, uploading, onUpload }: {
  field: { key: string; label: string; type: string; placeholder: string; hint?: string }
  value: string
  primary: string
  rgb: string
  onChange: (v: string) => void
  uploading?: boolean
  onUpload?: (file: File) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
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
        <div style={{ fontSize:11, color:'#9ca3af', marginBottom:6 }}>💡 {field.hint}</div>
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
            {value === 'true' ? '✅ Đang hiển thị' : '⭕ Đang ẩn'}
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
          <option value="140">Nhỏ — nhiều sản phẩm mỗi hàng</option>
          <option value="180">Vừa (mặc định)</option>
          <option value="220">Lớn — ảnh to hơn</option>
          <option value="280">Rất lớn — 3-4 sản phẩm/hàng</option>
        </select>
      ) : field.type === 'image_upload' ? (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              style={{ background: uploading ? '#9ca3af' : '#059669', color:'white', border:'none', padding:'9px 16px', borderRadius:8, fontWeight:700, fontSize:12, cursor: uploading ? 'not-allowed' : 'pointer', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6 }}>
              {uploading ? '⏳ Đang tải...' : '📷 Tải ảnh lên'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f && onUpload) onUpload(f); e.target.value = '' }} />
            <span style={{ fontSize:12, color:'#9ca3af', alignSelf:'center' }}>hoặc paste URL:</span>
          </div>
          <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} style={base} />
          {value && (
            <div style={{ position:'relative', display:'inline-block' }}>
              <img src={value} alt="preview" style={{ maxHeight:120, maxWidth:'100%', borderRadius:8, border:'1px solid #e5e7eb', objectFit:'cover' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <button onClick={() => onChange('')} style={{ position:'absolute', top:4, right:4, background:'rgba(0,0,0,0.6)', color:'white', border:'none', borderRadius:'50%', width:22, height:22, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>
          )}
        </div>

      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} style={base} />
      )}
    </div>
  )
}
