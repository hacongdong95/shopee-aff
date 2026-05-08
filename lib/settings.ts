// lib/settings.ts
import { prisma } from '@/lib/prisma'

export const DEFAULT_SETTINGS: Record<string, string> = {
  site_name:        'Shopee Deals',
  site_tagline:     'Deal hot mỗi ngày',
  site_logo_emoji:  '🛍️',
  banner_title:     '🔥 Deal Hot Mỗi Ngày',
  banner_subtitle:  'Hàng ngàn sản phẩm giảm giá sâu — mua ngay kẻo hết!',
  banner_show:      'true',
  footer_text:      'Tổng hợp sản phẩm giảm giá tốt nhất từ Shopee',
  footer_copyright: '© 2025 · Affiliate Website',
  primary_color:    '#ee4d2d',
  shipping_text:    '🚚 Miễn phí vận chuyển · Giao trong 2-5 ngày',
  guarantee_text:   '✅ Hoàn tiền nếu hàng không đúng mô tả',
  return_text:      '↩️ Đổi trả miễn phí trong 15 ngày',
  buy_button_text:  'Mua Ngay',
  shopee_badge:     'Đảm bảo chính hãng · Giao nhanh',
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany()
  const result = { ...DEFAULT_SETTINGS }
  for (const row of rows) {
    result[row.key] = row.value
  }
  return result
}
