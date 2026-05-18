import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductDetail from '@/components/ProductDetail'
import type { Metadata } from 'next'
import Script from 'next/script'

export const revalidate = 60

const BASE_URL = 'https://giadinhsudo.store'

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

  const siteName = settings.site_name || 'Gia Đình Su Đô'
  const thumb = product.imageUrl?.split('\n')[0].trim() || ''
  const discount = product.oldPrice && product.oldPrice > product.price
    ? Math.round((1 - product.price / product.oldPrice) * 100) : null
  const title = `${product.name}${discount ? ` -${discount}%` : ''} | ${siteName}`
  const description = product.description
    ? product.description.replace(/<[^>]+>/g, '').replace(/\\n/g, ' ').slice(0, 160)
    : `${product.name} giá ${product.price.toLocaleString('vi-VN')}đ${discount ? `, giảm ${discount}%` : ''}. Mua tại ${siteName}.`

  const canonicalUrl = `${BASE_URL}/san-pham/${slug}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      siteName,
      type: 'website',
      url: canonicalUrl,
      locale: 'vi_VN',
      ...(thumb ? { images: [{ url: thumb, width: 800, height: 800, alt: product.name }] } : {}),
    },
    twitter: {
      card: thumb ? 'summary_large_image' : 'summary',
      title,
      description,
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
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
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

  // ── Schema markup JSON-LD ──
  const thumb = product.imageUrl?.split('\n')[0].trim() || ''
  const allImages = product.imageUrl
    ? product.imageUrl.split('\n').map(u => u.trim()).filter(Boolean)
    : []
  const siteName = settings.site_name || 'Gia Đình Su Đô'
  const canonicalUrl = `${BASE_URL}/san-pham/${slug}`

  // Lấy reviews từ DB để tính rating thật
  const reviews = await prisma.review.findMany({
    where: { productId: product.id },
    select: { rating: true, name: true, comment: true, createdAt: true },
    take: 10,
    orderBy: { createdAt: 'desc' },
  }).catch(() => [])

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating as number), 0 as number) / reviews.length).toFixed(1)
    : '4.8'
  const reviewCount = reviews.length || 0

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description
      ? product.description.replace(/<[^>]+>/g, '').replace(/\\n/g, ' ').slice(0, 500)
      : product.name,
    image: allImages.length > 0 ? allImages : thumb ? [thumb] : undefined,
    url: canonicalUrl,
    brand: {
      '@type': 'Brand',
      name: siteName,
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'VND',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: siteName,
        url: BASE_URL,
      },
      ...(product.oldPrice && product.oldPrice > product.price ? {
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: product.price,
          priceCurrency: 'VND',
        }
      } : {}),
    },
    ...(reviewCount > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating,
        reviewCount: reviewCount,
        bestRating: '5',
        worstRating: '1',
      },
      review: reviews.slice(0, 3).map(r => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.name },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
          bestRating: '5',
        },
        reviewBody: r.comment,
        datePublished: r.createdAt.toISOString().split('T')[0],
      })),
    } : {}),
    category: product.category.name,
  }

  // Breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: product.category.name, item: `${BASE_URL}/?cat=${product.category.slug}` },
      { '@type': 'ListItem', position: 3, name: product.name, item: canonicalUrl },
    ],
  }

  // WebSite schema (search box)
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <Script
        id="schema-product"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Script
        id="schema-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="schema-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <ProductDetail product={product} related={related} settings={settings} categories={categories} />
    </>
  )
}
