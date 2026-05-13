import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductDetail from '@/components/ProductDetail'
import type { Metadata } from 'next'

export const revalidate = 60

async function getSettings() {
  const rows = await prisma.setting.findMany()
  const s: Record<string, string> = {}
  for (const row of rows) s[row.key] = row.value
  return s
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const [product, settings] = await Promise.all([
    prisma.product.findUnique({ where: { slug }, include: { category: true } }),
    getSettings(),
  ])
  if (!product) return {}

  const siteName = settings.site_name || 'Shopee Deals'
  const thumb = product.imageUrl?.split('\n')[0].trim() || ''
  const discount = product.oldPrice && product.oldPrice > product.price
    ? Math.round((1 - product.price / product.oldPrice) * 100) : null
  const title = `${product.name}${discount ? ` -${discount}%` : ''} | ${siteName}`
  const description = product.description
    ? product.description.replace(/<[^>]+>/g, '').replace(/\\n/g, ' ').slice(0, 160)
    : `${product.name} giá ${product.price.toLocaleString('vi-VN')}đ${discount ? `, giảm ${discount}%` : ''}. Mua tại ${siteName}.`

  return {
    title,
    description,
    openGraph: {
      title, description, siteName, type: 'website',
      ...(thumb ? { images: [{ url: thumb, width: 800, height: 800, alt: product.name }] } : {}),
    },
    twitter: {
      card: thumb ? 'summary_large_image' : 'summary',
      title, description,
      ...(thumb ? { images: [thumb] } : {}),
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [product, settings, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    }),
    getSettings(),
    prisma.category.findMany({ orderBy: { name: 'asc' } }), // ← thêm để hiện category tabs
  ])

  if (!product || !product.isActive) notFound()

  const relatedSame = await prisma.product.findMany({
    where: { categoryId: product.categoryId, isActive: true, NOT: { id: product.id } },
    include: { category: true },
    orderBy: { clicks: 'desc' },
    take: 8,
  })

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

  return <ProductDetail product={product} related={related} settings={settings} categories={categories} />
}
