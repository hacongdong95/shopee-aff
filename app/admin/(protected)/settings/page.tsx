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
  { id: 'giaodien', label: '🎨 Giao diện' },
  { id: 'noidung',  label: '📝 Nội dung' },
  { id: 'seo',      label: '🔍 SEO' },
]

// ─── Fields theo tab ──────────────────────────────────────────────────────
const TAB_FIELDS: Record<string, { key: string; label: string; type: string; placeholder: string; hint?: string }[]> = {
  giaodien: [
    { key: 'primary_color',    label: 'Màu chủ đạo',       type: 'color',  placeholder: '#ee4d2d', hint: 'Áp dụng cho header, nút, banner...' },
    { key: 'site_logo_emoji',  label: 'Logo (emoji)',       type: 'text',   placeholder: '🛍️',    hint: 'Hiển thị ở header và footer' },
    { key: 'banner_show',      label: 'Hiện banner trang chủ', type: 'toggle', placeholder: 'true' },
    { key: 'banner_title',     label: 'Tiêu đề banner',    type: 'text',   placeholder: '🔥 Deal Hot Mỗi Ngày' },
    { key: 'banner_subtitle',  label: 'Mô tả banner',      type: 'textarea', placeholder: 'Hàng ngàn sản phẩm giảm giá...' },
  ],
  noidung: [
    { key: 'site_name',        label: 'Tên website',        type: 'text',   placeholder: 'Shopee Deals' },
    { key: 'site_tagline',     label: 'Slogan',             type: 'text',   placeholder: 'Deal hot mỗi ngày' },
    { key: 'buy_button_text',  label: 'Text nút Mua Ngay',  type: 'text',   placeholder: 'Mua Ngay' },
    { key: 'shopee_badge',     label: 'Badge Shopee',       type: 'text',   placeholder: 'Đảm bảo chính hãng · Giao nhanh' },
    { key: 'shipping_text',    label: 'Vận chuyển',         type: 'text',   placeholder: '🚚 Miễn phí vận chuyển' },
    { key: 'guarantee_text',   label: 'Đảm bảo',           type: 'text',   placeholder: '✅ Hoàn tiền nếu không đúng mô tả' },
    { key: 'return_text',      label: 'Đổi trả',            type: 'text',   placeholder: '↩️ Đổi trả miễn phí 15 ngày' },
    { key: 'footer_text',      label: 'Mô tả footer',       type: 'textarea', placeholder: 'Tổng hợp sản phẩm giảm giá...' },
    { key: 'footer_copyright', label: 'Copyright',          type: 'text',   placeholder: '© 2025 · Affiliate Website' },
  ],
  seo: [
    { key: 'seo_title',        label: 'Tiêu đề trang (SEO)', type: 'text',  placeholder: 'Shopee Deals – Săn Deal Mỗi Ngày', hint: 'Nên dưới 60 ký tự' },
    { key: 'seo_description',  label: 'Mô tả (meta description)', type: 'textarea', placeholder: 'Tổng hợp sản phẩm giảm giá tốt nhất từ Shopee...', hint: 'Nên từ 120–160 ký tự' },
    { key: 'seo_keywords',     label: 'Keywords',            type: 'text',  placeholder: 'shopee, deal, giảm giá, affiliate', hint: 'Ngăn cách bằng dấu phẩy' },
  ],
}

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
  const previewRef = useRef<HTMLIFrameElement>(null)

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

  const primary = settings.primary_color || '#ee4d2d'
  const rgb     = hexToRgb(primary)
  const dark    = darken(primary)

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:80, color:'#9ca3af' }}>
      <div style={{ fontSize:32, marginRight:12 }}>⚙️</div>
      <div>Đang tải cài đặt...</div>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* ── Topbar ── */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom:24, flexWrap:'wrap', gap:12,
      }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:'#111' }}>⚙️ Cài đặt website</h2>
          <p style={{ margin:'4px 0 0', color:'#6b7280', fontSize:13 }}>
            Tùy chỉnh giao diện và nội dung — không cần chỉnh code
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button
            onClick={() => setPreviewOpen(v => !v)}
            style={{
              background:'white', color:'#374151',
              border:'1.5px solid #e5e7eb', padding:'9px 18px',
              borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer',
              display:'flex', alignItems:'center', gap:6,
            }}
          >
            👁️ {previewOpen ? 'Ẩn preview' : 'Live Preview'}
          </button>
          <button onClick={save} disabled={saving} style={{
            background: saving ? '#9ca3af' : saved ? '#059669' : primary,
            color:'white', border:'none', padding:'9px 24px',
            borderRadius:8, fontWeight:700, fontSize:14,
            cursor: saving ? 'not-allowed' : 'pointer',
            display:'flex', alignItems:'center', gap:8,
            transition:'background 0.2s', boxShadow:`0 2px 8px rgba(${rgb},0.35)`,
          }}>
            {saving ? '⏳ Đang lưu...' : saved ? '✅ Đã lưu!' : '💾 Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* ── Layout: form + preview ── */}
      <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>

        {/* ── Left: Tabs + Form ── */}
        <div style={{ flex:1, minWidth:0 }}>

          {/* Tabs */}
          <div style={{
            display:'flex', gap:4, marginBottom:20,
            background:'white', padding:6, borderRadius:12,
            boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
          }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex:1, padding:'9px 0', border:'none',
                  borderRadius:8, fontSize:14, fontWeight:600,
                  cursor:'pointer', transition:'all 0.15s',
                  background: activeTab === tab.id ? primary : 'transparent',
                  color:       activeTab === tab.id ? 'white' : '#6b7280',
                  boxShadow:   activeTab === tab.id ? `0 2px 8px rgba(${rgb},0.3)` : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Color palette (chỉ hiện ở tab Giao diện) */}
          {activeTab === 'giaodien' && (
            <div style={{
              background:'white', borderRadius:12, padding:'16px 20px',
              boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:16,
            }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:12 }}>
                🎨 Bộ màu gợi ý — chọn 1 click
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                {PALETTES.map(p => (
                  <button
                    key={p.color}
                    onClick={() => set('primary_color', p.color)}
                    title={p.name}
                    style={{
                      display:'flex', alignItems:'center', gap:8,
                      padding:'6px 12px', borderRadius:20,
                      border: settings.primary_color === p.color
                        ? `2.5px solid ${p.color}`
                        : '2px solid #e5e7eb',
                      background: settings.primary_color === p.color
                        ? `rgba(${hexToRgb(p.color)},0.08)`
                        : 'white',
                      cursor:'pointer', fontSize:12, fontWeight:600,
                      color:'#374151', transition:'all 0.15s',
                    }}
                  >
                    <span style={{
                      width:16, height:16, borderRadius:'50%',
                      background:p.color, flexShrink:0,
                      boxShadow: settings.primary_color === p.color ? `0 0 0 2px white, 0 0 0 4px ${p.color}` : 'none',
                    }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fields */}
          <div style={{
            background:'white', borderRadius:12,
            boxShadow:'0 1px 4px rgba(0,0,0,0.08)', overflow:'hidden',
          }}>
            <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:20 }}>
              {TAB_FIELDS[activeTab].map(field => (
                <FieldRow
                  key={field.key}
                  field={field}
                  value={settings[field.key] || ''}
                  primary={primary}
                  rgb={rgb}
                  onChange={v => set(field.key, v)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Live Preview ── */}
        {previewOpen && (
          <div style={{
            width:400, flexShrink:0,
            position:'sticky', top:20,
          }}>
            <div style={{
              background:'white', borderRadius:12,
              boxShadow:'0 1px 4px rgba(0,0,0,0.1)', overflow:'hidden',
            }}>
              <div style={{
                padding:'10px 16px', borderBottom:'1px solid #f0f0f0',
                fontSize:12, fontWeight:700, color:'#6b7280',
                display:'flex', alignItems:'center', gap:6,
              }}>
                <span style={{ width:10, height:10, borderRadius:'50%', background:'#ef4444', display:'inline-block' }} />
                <span style={{ width:10, height:10, borderRadius:'50%', background:'#f59e0b', display:'inline-block' }} />
                <span style={{ width:10, height:10, borderRadius:'50%', background:'#10b981', display:'inline-block' }} />
                <span style={{ marginLeft:8 }}>Preview trang chủ</span>
              </div>

              {/* Mini preview */}
              <div style={{ padding:0, fontSize:11, lineHeight:1.5 }}>
                {/* Header preview */}
                <div style={{
                  background: `linear-gradient(135deg, ${primary} 0%, ${darken(primary,-0.15)} 100%)`,
                  padding:'10px 14px', color:'white',
                  display:'flex', alignItems:'center', gap:8,
                }}>
                  <span style={{ fontSize:16 }}>{settings.site_logo_emoji || '🛍️'}</span>
                  <span style={{ fontWeight:800, fontSize:13 }}>{settings.site_name || 'Shopee Deals'}</span>
                  <div style={{
                    marginLeft:'auto', background:'rgba(255,255,255,0.2)',
                    borderRadius:10, padding:'3px 10px', fontSize:10,
                  }}>🔍 Tìm kiếm...</div>
                </div>

                {/* Category tabs preview */}
                <div style={{ background:`rgba(${rgb},0.15)`, padding:'4px 14px', display:'flex', gap:4 }}>
                  {['Tất cả','Điện tử','Thời trang','Nhà bếp'].map((c,i) => (
                    <span key={c} style={{
                      padding:'3px 8px', borderRadius:'4px 4px 0 0', fontSize:10,
                      background: i===0 ? 'white' : 'transparent',
                      color: i===0 ? primary : 'rgba(255,255,255,0.85)',
                      fontWeight: i===0 ? 700 : 500,
                    }}>{c}</span>
                  ))}
                </div>

                {/* Banner preview */}
                {settings.banner_show !== 'false' && (
                  <div style={{
                    background:`linear-gradient(135deg, ${primary} 0%, ${dark} 100%)`,
                    padding:'12px 14px', color:'white', textAlign:'center',
                  }}>
                    <div style={{ fontWeight:800, fontSize:12 }}>{settings.banner_title || '🔥 Deal Hot Mỗi Ngày'}</div>
                    <div style={{ fontSize:10, opacity:0.85, marginTop:2 }}>{settings.banner_subtitle || 'Hàng ngàn sản phẩm giảm giá sâu'}</div>
                  </div>
                )}

                {/* Products preview */}
                <div style={{ padding:'10px 14px', background:'#f5f5f5' }}>
                  <div style={{ fontSize:10, color:'#888', marginBottom:8 }}>Tất cả sản phẩm — 24 sản phẩm</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} style={{
                        background:'white', borderRadius:6, overflow:'hidden',
                        boxShadow:'0 1px 3px rgba(0,0,0,0.08)',
                      }}>
                        <div style={{ height:52, background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                          📦
                        </div>
                        <div style={{ padding:'4px 6px' }}>
                          <div style={{ fontSize:9, fontWeight:600, color:'#333', marginBottom:2 }}>Sản phẩm {i}</div>
                          <div style={{ fontSize:10, fontWeight:800, color:primary }}>120.000đ</div>
                          <div style={{
                            marginTop:4, background:primary, color:'white',
                            textAlign:'center', borderRadius:4, padding:'2px 0',
                            fontSize:9, fontWeight:700,
                          }}>{settings.buy_button_text || 'Mua Ngay'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer preview */}
                <div style={{ background:'#222', color:'#aaa', padding:'8px 14px', textAlign:'center' }}>
                  <div style={{ color:'white', fontWeight:700, fontSize:11 }}>{settings.site_logo_emoji || '🛍️'} {settings.site_name || 'Shopee Deals'}</div>
                  <div style={{ fontSize:9, marginTop:2 }}>{settings.footer_copyright || '© 2025 · Affiliate Website'}</div>
                </div>
              </div>
            </div>

            {/* Màu đang dùng */}
            <div style={{
              marginTop:12, background:'white', borderRadius:12,
              padding:'12px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
            }}>
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
        <div style={{ fontSize:11, color:'#9ca3af', marginBottom:6 }}>💡 {field.hint}</div>
      )}

      {field.type === 'toggle' ? (
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div
            onClick={() => onChange(value === 'true' ? 'false' : 'true')}
            style={{
              width:48, height:26, borderRadius:13, cursor:'pointer',
              background: value === 'true' ? primary : '#d1d5db',
              position:'relative', transition:'background 0.2s', flexShrink:0,
              boxShadow: value === 'true' ? `0 0 0 3px rgba(${rgb},0.2)` : 'none',
            }}
          >
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
          <input
            type="color"
            value={value || field.placeholder}
            onChange={e => onChange(e.target.value)}
            style={{ width:48, height:40, borderRadius:8, border:'1.5px solid #e5e7eb', cursor:'pointer', padding:2 }}
          />
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            style={{ ...base, width:130 }}
          />
          <div style={{
            width:40, height:40, borderRadius:8,
            background: value || field.placeholder,
            border:'1px solid #e5e7eb',
            boxShadow:`0 2px 8px rgba(${rgb},0.3)`,
          }} />
          <span style={{ fontSize:12, color:'#9ca3af' }}>Preview</span>
        </div>

      ) : field.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          style={{ ...base, resize:'vertical', lineHeight:1.6 }}
        />

      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          style={base}
        />
      )}
    </div>
  )
}
