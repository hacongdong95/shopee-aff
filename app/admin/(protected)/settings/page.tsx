'use client'

import { useEffect, useState } from 'react'

type Settings = Record<string, string>

const SECTIONS = [
  {
    title: '🌐 Thông tin website',
    icon: '🌐',
    fields: [
      { key: 'site_name',       label: 'Tên website',       type: 'text',  placeholder: 'Shopee Deals' },
      { key: 'site_tagline',    label: 'Slogan',             type: 'text',  placeholder: 'Deal hot mỗi ngày' },
      { key: 'site_logo_emoji', label: 'Logo (emoji)',       type: 'text',  placeholder: '🛍️' },
    ],
  },
  {
    title: '🎨 Màu sắc & Giao diện',
    icon: '🎨',
    fields: [
      { key: 'primary_color', label: 'Màu chủ đạo', type: 'color', placeholder: '#ee4d2d' },
    ],
  },
  {
    title: '📢 Banner trang chủ',
    icon: '📢',
    fields: [
      { key: 'banner_show',     label: 'Hiện banner',    type: 'toggle', placeholder: 'true' },
      { key: 'banner_title',    label: 'Tiêu đề banner', type: 'text',   placeholder: '🔥 Deal Hot Mỗi Ngày' },
      { key: 'banner_subtitle', label: 'Mô tả banner',   type: 'text',   placeholder: 'Hàng ngàn sản phẩm giảm giá...' },
    ],
  },
  {
    title: '🚚 Thông tin giao hàng & chính sách',
    icon: '🚚',
    fields: [
      { key: 'shipping_text',  label: 'Thông tin vận chuyển', type: 'text', placeholder: '🚚 Miễn phí vận chuyển...' },
      { key: 'guarantee_text', label: 'Chính sách đảm bảo',   type: 'text', placeholder: '✅ Hoàn tiền nếu...' },
      { key: 'return_text',    label: 'Chính sách trả hàng',  type: 'text', placeholder: '↩️ Đổi trả miễn phí...' },
    ],
  },
  {
    title: '🛒 Nút mua hàng & Badge',
    icon: '🛒',
    fields: [
      { key: 'buy_button_text', label: 'Text nút Mua Ngay', type: 'text', placeholder: 'Mua Ngay' },
      { key: 'shopee_badge',    label: 'Badge Shopee',      type: 'text', placeholder: 'Đảm bảo chính hãng · Giao nhanh' },
    ],
  },
  {
    title: '🦶 Footer',
    icon: '🦶',
    fields: [
      { key: 'footer_text',      label: 'Mô tả footer',  type: 'text', placeholder: 'Tổng hợp sản phẩm giảm giá...' },
      { key: 'footer_copyright', label: 'Copyright',     type: 'text', placeholder: '© 2025 · Affiliate Website' },
    ],
  },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #e5e7eb', borderRadius: 8,
  fontSize: 14, outline: 'none', background: 'white',
  boxSizing: 'border-box',
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      setSettings(data)
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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, color: '#9ca3af' }}>
      <div style={{ fontSize: 32, marginRight: 12 }}>⚙️</div>
      <div>Đang tải cài đặt...</div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Cài đặt website</h2>
          <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: 13 }}>Tùy chỉnh giao diện và nội dung mà không cần chỉnh code</p>
        </div>
        <button onClick={save} disabled={saving} style={{
          background: saving ? '#9ca3af' : saved ? '#059669' : '#ee4d2d',
          color: 'white', border: 'none', padding: '10px 28px',
          borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.2s',
        }}>
          {saving ? '⏳ Đang lưu...' : saved ? '✅ Đã lưu!' : '💾 Lưu thay đổi'}
        </button>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {SECTIONS.map(section => (
          <div key={section.title} style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

            {/* Section header */}
            <div style={{ padding: '14px 20px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{section.icon}</span>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#374151' }}>{section.title}</h3>
            </div>

            {/* Fields */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {section.fields.map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    {field.label}
                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginLeft: 8 }}>({field.key})</span>
                  </label>

                  {field.type === 'toggle' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        onClick={() => set(field.key, settings[field.key] === 'true' ? 'false' : 'true')}
                        style={{
                          width: 48, height: 26, borderRadius: 13, cursor: 'pointer',
                          background: settings[field.key] === 'true' ? '#ee4d2d' : '#d1d5db',
                          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', background: 'white',
                          position: 'absolute', top: 3,
                          left: settings[field.key] === 'true' ? 25 : 3,
                          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                      </div>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>
                        {settings[field.key] === 'true' ? 'Đang hiển thị' : 'Đang ẩn'}
                      </span>
                    </div>
                  ) : field.type === 'color' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input
                        type="color"
                        value={settings[field.key] || field.placeholder}
                        onChange={e => set(field.key, e.target.value)}
                        style={{ width: 48, height: 40, borderRadius: 8, border: '1.5px solid #e5e7eb', cursor: 'pointer', padding: 2 }}
                      />
                      <input
                        type="text"
                        value={settings[field.key] || ''}
                        onChange={e => set(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        style={{ ...inputStyle, width: 140 }}
                      />
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: settings[field.key] || field.placeholder, border: '1px solid #e5e7eb' }} />
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>Preview màu chủ đạo</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={settings[field.key] || ''}
                      onChange={e => set(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      style={inputStyle}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky save button bottom */}
      <div style={{ position: 'sticky', bottom: 20, marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={save} disabled={saving} style={{
          background: saving ? '#9ca3af' : saved ? '#059669' : '#ee4d2d',
          color: 'white', border: 'none', padding: '12px 36px',
          borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 16px rgba(238,77,45,0.35)', transition: 'background 0.2s',
        }}>
          {saving ? '⏳ Đang lưu...' : saved ? '✅ Đã lưu thành công!' : '💾 Lưu thay đổi'}
        </button>
      </div>
    </div>
  )
}
