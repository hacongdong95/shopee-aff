import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [totalProducts, totalCategories, totalClicks, recentProducts] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.product.aggregate({ _sum: { clicks: true } }),
    prisma.product.findMany({
      take: 5,
      orderBy: { clicks: 'desc' },
      include: { category: true },
    }),
  ])

  const stat = (label: string, value: string | number, color = 'var(--shopee)') => (
    <div className="card" style={{ padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 32, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
    </div>
  )

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {stat('Sản phẩm', totalProducts)}
        {stat('Danh mục', totalCategories, '#059669')}
        {stat('Tổng clicks', totalClicks._sum.clicks ?? 0, '#7c3aed')}
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Top sản phẩm được click</h3>
          <Link href="/admin/products" style={{ color: 'var(--shopee)', fontSize: 14 }}>Xem tất cả →</Link>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--muted)' }}>Sản phẩm</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--muted)' }}>Danh mục</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--muted)' }}>Clicks</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--muted)' }}>Giá</th>
            </tr>
          </thead>
          <tbody>
            {recentProducts.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>{p.category.name}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#7c3aed', fontWeight: 700 }}>{p.clicks}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--shopee)' }}>
                  {p.price.toLocaleString('vi-VN')}đ
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
