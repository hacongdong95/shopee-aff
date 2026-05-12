import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductDetail from '@/components/ProductDetail'

export const revalidate = 60

async function getSettings() {
  const rows = await prisma.setting.findMany()
  const s: Record<string, string> = {}
  for (const row of rows) s[row.key] = row.value
  return s
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [product, settings] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    }),
    getSettings(),
  ])

  if (!product || !product.isActive) notFound()

  // Lấy sản phẩm cùng danh mục con (ưu tiên)
  const relatedSame = await prisma.product.findMany({
    where: { categoryId: product.categoryId, isActive: true, NOT: { id: product.id } },
    include: { category: true },
    orderBy: { clicks: 'desc' },
    take: 8,
  })

  // Nếu chưa đủ 8, bổ sung từ các danh mục con khác cùng cha
  let related = relatedSame
  if (relatedSame.length < 8 && product.category.parentId) {
    const siblingCats = await prisma.category.findMany({
      where: { parentId: product.category.parentId, NOT: { id: product.categoryId } },
      select: { id: true },
    })
    if (siblingCats.length > 0) {
      const extra = await prisma.product.findMany({
        where: {
          categoryId: { in: siblingCats.map(c => c.id) },
          isActive: true,
          NOT: { id: product.id },
        },
        include: { category: true },
        orderBy: { clicks: 'desc' },
        take: 8 - relatedSame.length,
      })
      related = [...relatedSame, ...extra]
    }
  }

  return <ProductDetail product={product} related={related} settings={settings} />
}
