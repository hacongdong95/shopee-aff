// components/ThemeProvider.tsx
// Server Component — inject CSS variables vào <head>
// Dùng model Setting (khớp với page.tsx hiện tại)

import { prisma } from '@/lib/prisma'

export default async function ThemeProvider() {
  let primary = '#ee4d2d'
  let voucherText = ''

  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ['primary_color', 'voucher_text'] } }
    })
    for (const r of rows) {
      if (r.key === 'primary_color') primary = r.value
      if (r.key === 'voucher_text') voucherText = r.value
    }
  } catch {
    // DB chưa có key → dùng màu mặc định
  }

  const c = primary.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16) || 238
  const g = parseInt(c.slice(2, 4), 16) || 77
  const b = parseInt(c.slice(4, 6), 16) || 45

  const css = [
    ':root {',
    `  --primary:       ${primary};`,
    `  --primary-light: rgba(${r},${g},${b},0.12);`,
    `  --primary-mid:   rgba(${r},${g},${b},0.25);`,
    `  --shopee:        ${primary};`,
    `  --voucher-text:  "${voucherText.replace(/"/g, '\\"')}";`,
    '}',
  ].join('\n')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.setAttribute('data-voucher','${voucherText.replace(/'/g, "\\'")}')` }} />
    </>
  )
}
